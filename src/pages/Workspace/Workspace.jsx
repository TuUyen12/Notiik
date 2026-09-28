import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { exportSingleNote, exportProjectToZip } from '../../utils/exportUtils';
import logoImg from '../../assets/images/Notiik.png';
import './Workspace.css';

// Các hằng số map
const tabNames = {
  inbox: 'Hộp thư',
  projects: 'Dự án',
  personal: 'Cá nhân',
  shared: 'Đã chia sẻ',
};

export default function Workspace() {
  const { currentUser, logout } = useAuth();
  
  // State chứa dữ liệu ghi chú lấy từ Database
  const [notesData, setNotesData] = useState({
    projects: [],
    personal: [],
    shared: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // States cho tính năng chia sẻ và tạo dự án
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // States cho tính năng xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  // State cho tính năng Xuất file
  const [exportModalConfig, setExportModalConfig] = useState({ isOpen: false, type: null }); // type: 'note' | 'project'
  const [isExporting, setIsExporting] = useState(false);

  const typingTimeoutRef = useRef(null); 
  const pendingUpdates = useRef({}); // Lưu trữ các trường cần update cùng lúc
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // States cho hộp thư
  const [inboxNotifications, setInboxNotifications] = useState([]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    // 1. Lấy danh sách Dự án (của mình)
    const { data: projectsList } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // 2. Lấy danh sách Ghi chú (của mình hoặc đã được chia sẻ)
    const { data: notesDataList } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
      
    // 3. Lấy các thông báo Hộp thư
    // a. Lời mời người khác gửi cho mình (Từ bảng project_shares)
    const { data: invitesForMe } = await supabase
      .from('project_shares')
      .select('*')
      .eq('shared_with_email', currentUser.email)
      .eq('status', 'pending');

    // b. Lời mời của mình bị người khác từ chối (Chỉ lấy trong vòng 30 ngày)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: declinedByOthers } = await supabase
      .from('project_shares')
      .select('*')
      .eq('owner_id', currentUser.id)
      .in('status', ['declined', 'dismissed'])
      .gte('created_at', thirtyDaysAgo.toISOString());

    // c. Lấy các dự án mà mình đã accepted từ người khác
    // Tuy nhiên RLS bảng projects đã cho phép select nếu accepted, nên nó nằm sẵn trong projectsList!

    const grouped = { projects: [], personal: [], shared: [] };
    const projectsMap = {};

    if (projectsList) {
      projectsList.forEach(p => {
        projectsMap[p.id] = { ...p, type: 'project', isExpanded: true, notes: [] };
      });
    }

    if (notesDataList) {
      notesDataList.forEach(note => {
        if (note.project_id && projectsMap[note.project_id]) {
          projectsMap[note.project_id].notes.push(note);
        } else if (!note.project_id) {
          // Ghi chú cá nhân tự do (không thuộc dự án nào)
          grouped.personal.push(note);
        }
      });
    }

    // Phân loại Project vào 'projects' (của mình) hoặc 'shared' (của người khác)
    Object.values(projectsMap).forEach(p => {
      if (p.user_id === currentUser.id) {
        grouped.projects.push(p);
      } else {
        grouped.shared.push(p);
      }
    });

    setNotesData(grouped);

    const allNotifs = [];
    
    if (invitesForMe) {
      invitesForMe.forEach(share => {
        allNotifs.push({
          id: share.id,
          project_id: share.project_id,
          title: `Lời mời tham gia dự án: ${share.project_name}`,
          description: `${share.owner_email} mời bạn tham gia cùng chỉnh sửa dự án này.`,
          time: new Date(share.created_at).toLocaleString(),
          type: 'invite',
          timestamp: new Date(share.created_at).getTime(),
          read: false,
        });
      });
    }

    if (declinedByOthers) {
      declinedByOthers.forEach(share => {
        allNotifs.push({
          id: share.id,
          project_id: share.project_id,
          title: `${share.shared_with_email} đã từ chối tham gia`,
          description: `Lời mời tham gia dự án "${share.project_name}" của bạn đã bị từ chối.`,
          time: new Date(share.created_at).toLocaleString(),
          type: 'declined',
          timestamp: new Date(share.created_at).getTime(),
          read: share.status === 'dismissed', 
        });
      });
    }

    // Sắp xếp thông báo mới nhất lên đầu
    allNotifs.sort((a, b) => b.timestamp - a.timestamp);
    
    setInboxNotifications(allNotifs);
    
    // Auto select first notification if in inbox tab and none selected
    if (activeTab === 'inbox' && allNotifs.length > 0 && !activeNotificationId) {
      setActiveNotificationId(allNotifs[0].id);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // --- HÀNH ĐỘNG HỘP THƯ (Tham gia / Từ chối / Đã hiểu) ---
  const handleAcceptInvite = async (shareId) => {
    const { error } = await supabase.from('project_shares').update({ status: 'accepted' }).eq('id', shareId);
    if (error) {
      console.error(error);
      alert("Lỗi khi tham gia dự án!");
    } else {
      alert("Đã tham gia dự án! Thư mục sẽ nằm trong tab Đã chia sẻ.");
      loadData();
      setActiveTab('shared');
    }
  };

  const handleDeclineInvite = async (shareId) => {
    await supabase.from('project_shares').update({ status: 'declined' }).eq('id', shareId);
    alert("Đã từ chối lời mời.");
    loadData();
  };

  const handleDismissNotification = async (shareId) => {
    await supabase.from('project_shares').update({ status: 'dismissed' }).eq('id', shareId);
    loadData();
  };

  const toggleProjectExpand = (projectId) => {
    setNotesData(prev => {
      const newProjects = prev.projects.map(p => p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p);
      const newShared = prev.shared.map(p => p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p);
      return { ...prev, projects: newProjects, shared: newShared };
    });
  };

  const handleCreateProject = () => {
    if (!currentUser) return;
    setIsProjectModalOpen(true);
    setNewProjectName('');
  };

  const submitCreateProject = async () => {
    if (!newProjectName || !newProjectName.trim()) return;
    setIsCreatingProject(true);

    // Tạo project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([{ user_id: currentUser.id, name: newProjectName.trim() }])
      .select()
      .single();

    if (pError || !project) {
      alert('Tạo dự án thất bại!');
      setIsCreatingProject(false);
      return;
    }

    // Tạo ngay 1 Note mặc định trong Project đó
    const { data: note } = await supabase
      .from('notes')
      .insert([{
        user_id: currentUser.id,
        project_id: project.id,
        title: 'Ghi chú đầu tiên',
        preview: 'Chưa có nội dung...',
        content: ''
      }])
      .select()
      .single();

    // Cập nhật State
    const newProject = { ...project, type: 'project', isExpanded: true, notes: note ? [note] : [] };
    setNotesData(prev => ({
      ...prev,
      projects: [newProject, ...prev.projects]
    }));
    
    setIsCreatingProject(false);
    setIsProjectModalOpen(false);
    if (note) setActiveNoteId(note.id);
  };

  // Tạo ghi chú mới
  const handleCreateNote = async (projectId = null) => {
    if (activeTab === 'inbox' || !currentUser) return; 
    
    // Nếu ở tab Cá nhân, projectId sẽ là null
    // Nếu ở tab Dự án, projectId sẽ truyền vào
    if (activeTab === 'projects' && !projectId) return;

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        user_id: currentUser.id,
        project_id: projectId,
        title: 'Ghi chú mới',
        preview: 'Chưa có nội dung...',
        content: ''
      }])
      .select()
      .single();

    if (error) {
      alert('Tạo ghi chú thất bại!');
      return;
    }
    
    // UI Update ngay lập tức (Không gọi loadData để tránh nháy màn hình)
    setNotesData(prev => {
      const newData = { ...prev };
      if (activeTab === 'personal') {
        newData.personal = [data, ...newData.personal];
      } else if (activeTab === 'projects' || activeTab === 'shared') {
        newData[activeTab] = newData[activeTab].map(p => {
          if (p.id === projectId) {
            return { ...p, notes: [data, ...p.notes], isExpanded: true };
          }
          return p;
        });
      }
      return newData;
    });
    
    setActiveNoteId(data.id);
  };

  // --- AUTO SELECT ITEM KHI CÓ DỮ LIỆU HOẶC ĐỔI TAB ---
  useEffect(() => {
    if (!loading && activeTab !== 'inbox' && !activeNoteId) {
      if (activeTab === 'personal' && notesData.personal?.length > 0) {
        setActiveNoteId(notesData.personal[0].id);
      } else if ((activeTab === 'projects' || activeTab === 'shared') && notesData[activeTab]?.length > 0) {
        // Lấy note đầu tiên của project đầu tiên
        const firstProject = notesData[activeTab][0];
        if (firstProject.notes?.length > 0) {
          setActiveNoteId(firstProject.notes[0].id);
        }
      }
    }
  }, [loading, activeTab, notesData, activeNoteId]);

  // --- HANDLERS ---
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchKeyword('');
    
    if (tabId === 'inbox') {
      setActiveNotificationId(inboxNotifications.length > 0 ? inboxNotifications[0].id : null);
      setActiveNoteId(null);
    } else {
      setActiveNotificationId(null);
      // Auto select logic in useEffect will handle setting activeNoteId
      setActiveNoteId(null); 
    }
  };

  // Tìm Active Note trong mảng đa cấp
  let activeNote = null;
  let activeProject = null; // Để dùng cho việc share
  if (activeTab === 'personal') {
    activeNote = notesData.personal.find(n => n.id === activeNoteId);
  } else if (activeTab === 'projects' || activeTab === 'shared') {
    for (const project of notesData[activeTab]) {
      const found = project.notes.find(n => n.id === activeNoteId);
      if (found) {
        activeNote = found;
        activeProject = project;
        break;
      }
    }
  }

  const activeNotification = inboxNotifications.find(n => n.id === activeNotificationId);

  // --- LỌC DỮ LIỆU TÌM KIẾM ---
  const filterNotes = (notes) => notes.filter(n => 
    n.title.toLowerCase().includes(searchKeyword.toLowerCase()) || 
    n.content.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const filteredPersonal = filterNotes(notesData.personal);
  
  const filteredProjects = notesData.projects.map(p => ({
    ...p,
    notes: filterNotes(p.notes)
  })).filter(p => p.notes.length > 0 || p.name.toLowerCase().includes(searchKeyword.toLowerCase()));
  
  const filteredShared = notesData.shared.map(p => ({
    ...p,
    notes: filterNotes(p.notes)
  })).filter(p => p.notes.length > 0 || p.name.toLowerCase().includes(searchKeyword.toLowerCase()));

  // 3. Cập nhật ghi chú (Real-time UI + Lưu DB chậm)
  const saveNoteToDb = async (noteId, updates) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
           ...updates,
           updated_at: new Date().toISOString()
        })
        .eq('id', noteId);
      
      if (error) throw error;
    } catch (err) {
      console.error("Lỗi khi lưu lên Database:", err);
    }
  };

  const handleUpdateNote = (field, value) => {
    if (!activeNoteId) return;

    let previewVal = undefined;
    if (field === 'content') {
      let textWithNewlines = value.replace(/<\/p>|<\/h[1-6]>|<br\s*\/?>/gi, '\n');
      let cleanText = textWithNewlines.replace(/<[^>]*>?/gm, '').trim(); 
      let lines = cleanText.split('\n').filter(line => line.trim() !== '');
      let firstLine = lines.length > 0 ? lines[0] : '';
      previewVal = firstLine.length > 0 
        ? firstLine.substring(0, 40) + (firstLine.length > 40 ? '...' : '')
        : 'Chưa có nội dung...';
    }

    // 1. Cập nhật UI ngay lập tức
    setNotesData(prev => {
      const newData = { ...prev };
      
      if (activeTab === 'personal') {
        newData.personal = newData.personal.map(note => {
          if (note.id === activeNoteId) {
            const updatedNote = { ...note, [field]: value };
            if (previewVal !== undefined) updatedNote.preview = previewVal;
            return updatedNote;
          }
          return note;
        });
      } else if (activeTab === 'projects' || activeTab === 'shared') {
        newData[activeTab] = newData[activeTab].map(project => ({
          ...project,
          notes: project.notes.map(note => {
            if (note.id === activeNoteId) {
              const updatedNote = { ...note, [field]: value };
              if (previewVal !== undefined) updatedNote.preview = previewVal;
              return updatedNote;
            }
            return note;
          })
        }));
      }
      
      return newData;
    });

    // 2. Lưu các trường cần update vào ref
    pendingUpdates.current[field] = value;
    if (previewVal !== undefined) pendingUpdates.current.preview = previewVal;
    
    const noteIdToSave = activeNoteId;

    // 3. Debounce lưu lên Database
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      saveNoteToDb(noteIdToSave, { ...pendingUpdates.current });
      pendingUpdates.current = {}; // Clear sau khi save
    }, 1000); 
  };

  // 4. Chia sẻ dự án
  const handleShareNote = async () => {
    if (!shareEmail || !shareEmail.includes('@') || !activeProject) return;
    setIsSharing(true);
    
    const { error } = await supabase
      .from('project_shares')
      .insert([{ 
        project_id: activeProject.id, 
        owner_id: currentUser.id, 
        shared_with_email: shareEmail,
        status: 'pending',
        project_name: activeProject.name,
        owner_email: currentUser.email
      }]);
      
    setIsSharing(false);
    
    if (error) {
      console.error("Lỗi chia sẻ:", error);
      alert("Lỗi khi chia sẻ: " + error.message);
    } else {
      alert("Đã gửi lời mời tham gia dự án thành công!");
      setIsShareModalOpen(false);
      setShareEmail('');
    }
  };

  // 5. Xóa ghi chú (Chỉ mở Hộp thoại)
  const handleDeleteNote = (e, id) => {
    e.stopPropagation(); 
    setNoteToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Xác nhận Xóa thực sự
  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete;
    
    // Đóng hộp thoại ngay lập tức cho mượt
    setIsDeleteModalOpen(false);
    setNoteToDelete(null);

    setNotesData(prev => {
      const newData = { ...prev };
      
      if (activeTab === 'personal') {
        newData.personal = newData.personal.filter(n => n.id !== id);
        if (activeNoteId === id) setActiveNoteId(newData.personal[0]?.id || null);
      } else if (activeTab === 'projects' || activeTab === 'shared') {
        newData[activeTab] = newData[activeTab].map(project => {
          const updatedProject = {
            ...project,
            notes: project.notes.filter(n => n.id !== id)
          };
          // Nếu xóa trúng note đang active, thử select note đầu tiên của project này
          if (activeNoteId === id) {
             setActiveNoteId(updatedProject.notes[0]?.id || null);
          }
          return updatedProject;
        });
      }
      
      return newData;
    });

    // Thực thi xóa trên DB
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) console.error("Lỗi xóa ghi chú:", error);
  };

// Xóa logic handleTextTransform và handleImageUpload vì ReactQuill đã tự lo hết!

  // 6. Xử lý xuất file
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      if (exportModalConfig.type === 'note' && activeNote) {
        await exportSingleNote(activeNote, format);
      } else if (exportModalConfig.type === 'project' && activeProject) {
        await exportProjectToZip(activeProject, format);
      }
    } catch (error) {
      console.error("Lỗi xuất file:", error);
      alert("Có lỗi xảy ra khi xuất file!");
    } finally {
      setIsExporting(false);
      setExportModalConfig({ isOpen: false, type: null });
    }
  };

  // Nếu đang loading thì hiện màn hình trắng hoặc xoay xoay (chống giật UI)
  if (loading) {
    return <div className="workspace-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className="workspace-container">
      {/* 1. SIDEBAR */}
      <aside className="workspace-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo" onClick={() => window.location.hash = ''} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src={logoImg} alt="Notiik Logo" style={{ height: '32px', width: 'auto', borderRadius: '6px' }} />
            <span className="brand-text">Notiik</span>
          </div>
        </div>
        
        <div className="sidebar-search">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm" 
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">Ghi chú</div>
          <ul className="nav-list">
            <li 
              className={activeTab === 'inbox' ? 'active-tab' : ''} 
              onClick={() => handleTabChange('inbox')}
            >
              <span className="nav-icon">📥</span> Hộp thư
            </li>
            <li 
              className={activeTab === 'projects' ? 'active-tab' : ''} 
              onClick={() => handleTabChange('projects')}
            >
              <span className="nav-icon">📁</span> Dự án
            </li>
            <li 
              className={activeTab === 'personal' ? 'active-tab' : ''} 
              onClick={() => handleTabChange('personal')}
            >
              <span className="nav-icon">👤</span> Cá nhân
            </li>
            <li 
              className={activeTab === 'shared' ? 'active-tab' : ''} 
              onClick={() => handleTabChange('shared')}
            >
              <span className="nav-icon">👥</span> Đã chia sẻ
            </li>
            <li>
              <span className="nav-icon">🏷️</span> Thẻ <span className="nav-add">+</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer" onClick={logout}>
          <span className="nav-icon">🚪</span> Đăng xuất
        </div>
      </aside>

      {/* 2. NOTES LIST OR NOTIFICATIONS */}
      <section className="workspace-notes-list">
        <div className="notes-list-header">
          <h2>{tabNames[activeTab]}</h2>
          {activeTab === 'projects' && (
            <button className="new-note-icon" onClick={handleCreateProject} title="Tạo dự án mới">📁+</button>
          )}
          {activeTab === 'personal' && (
            <button className="new-note-icon" onClick={() => handleCreateNote(null)} title="Tạo ghi chú mới">📝</button>
          )}
        </div>
        
        <div className="notes-items">
          {activeTab === 'inbox' ? (
            inboxNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`note-item ${activeNotificationId === notif.id ? 'active' : ''}`}
                onClick={() => setActiveNotificationId(notif.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div className="note-title" style={{ fontWeight: notif.read ? '500' : '700' }}>
                    {notif.title}
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                </div>
                <div className="note-preview">{notif.description}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{notif.time}</div>
              </div>
            ))
          ) : activeTab === 'personal' ? (
            filteredPersonal.map((note) => (
              <div 
                key={note.id} 
                className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                onClick={() => setActiveNoteId(note.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="note-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title}
                  </div>
                  {note.user_id === currentUser.id && (
                    <button 
                      className="btn-delete"
                      onClick={(e) => handleDeleteNote(e, note.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
                <div className="note-preview">{note.preview}</div>
              </div>
            ))
          ) : (
            (activeTab === 'projects' ? filteredProjects : filteredShared).map((project) => (
              <div key={project.id} className="project-group" style={{ marginBottom: '1rem' }}>
                <div 
                  className="project-header" 
                  onClick={() => toggleProjectExpand(project.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem', 
                    background: 'var(--wk-bg-main)', 
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    borderBottom: '1px solid var(--wk-border-light)'
                  }}
                >
                  <div>
                    <span style={{ marginRight: '8px' }}>{project.isExpanded ? '📂' : '📁'}</span>
                    {project.name}
                  </div>
                  {activeTab === 'projects' && (
                    <button 
                      className="btn-delete"
                      style={{ color: 'var(--wk-accent-main)', fontSize: '1.2rem' }}
                      onClick={(e) => { e.stopPropagation(); handleCreateNote(project.id); }}
                      title="Thêm ghi chú vào dự án"
                    >
                      +
                    </button>
                  )}
                </div>
                {project.isExpanded && (
                  <div className="project-notes">
                    {project.notes.map((note) => (
                      <div 
                        key={note.id} 
                        className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                        onClick={() => setActiveNoteId(note.id)}
                        style={{ borderLeft: '3px solid transparent', paddingLeft: '2rem' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div className="note-title" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {note.title}
                          </div>
                          {note.user_id === currentUser.id && (
                            <button 
                              className="btn-delete"
                              onClick={(e) => handleDeleteNote(e, note.id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                        <div className="note-preview">{note.preview}</div>
                      </div>
                    ))}
                    {project.notes.length === 0 && (
                      <button 
                        className="btn-add-note-inline" 
                        onClick={() => handleCreateNote(project.id)}
                      >
                        📁 Bấm vào đây để tạo ghi chú đầu tiên
                      </button>
                    )}
                    {project.notes.length > 0 && (activeTab === 'projects' || activeTab === 'shared') && (
                      <button 
                        className="btn-add-note-inline" 
                        onClick={() => handleCreateNote(project.id)}
                      >
                        + Thêm ghi chú mới
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {activeTab !== 'inbox' && (
            (activeTab === 'personal' && filteredPersonal.length === 0) ||
            ((activeTab === 'projects' || activeTab === 'shared') && (activeTab === 'projects' ? filteredProjects : filteredShared).length === 0)
          ) && (
            <div style={{ padding: '1.5rem', color: 'var(--wk-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              {searchKeyword ? 'Không tìm thấy kết quả.' : 'Chưa có dữ liệu ở mục này.'}
            </div>
          )}
        </div>
      </section>

      {/* 3. EDITOR OR NOTIFICATION DETAIL */}
      <main className="workspace-editor">
        <header className="editor-topbar">
          <div className="topbar-search">
             <span className="search-icon">🔍</span>
             <input 
               type="text" 
               placeholder="Tìm kiếm..." 
               value={searchKeyword}
               onChange={(e) => setSearchKeyword(e.target.value)}
             />
          </div>
          <div className="topbar-actions">
            {activeTab === 'projects' && (
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={handleCreateProject}>+ Dự án mới</button>
            )}
            {(activeTab === 'projects' || activeTab === 'shared') && activeProject && (
              <button className="btn-new-note" onClick={() => handleCreateNote(activeProject.id)}>+ Tạo Ghi chú</button>
            )}
            {activeTab === 'personal' && (
              <button className="btn-new-note" onClick={() => handleCreateNote(null)}>+ Tạo Ghi chú</button>
            )}
            {/* Nút Chia Sẻ Dự án */}
            {(activeTab === 'projects' || activeTab === 'shared') && activeProject && (
              <>
                <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setExportModalConfig({ isOpen: true, type: 'project' })}>
                  📥 Tải Dự án (ZIP)
                </button>
                <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setIsShareModalOpen(true)}>
                  👥 Chia sẻ Dự án
                </button>
              </>
            )}
            
            {/* Nút Tải 1 Ghi chú */}
            {activeTab === 'personal' && activeNote && (
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setExportModalConfig({ isOpen: true, type: 'note' })}>
                📥 Tải Ghi chú
              </button>
            )}
            {(activeTab === 'projects' || activeTab === 'shared') && activeNote && (
              <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setExportModalConfig({ isOpen: true, type: 'note' })}>
                📥 Tải Ghi chú
              </button>
            )}
            <button className="btn-icon notification">
              🔔
              <span className="badge">1</span>
            </button>
            <div className="avatar">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        <div className="editor-container">
          {activeTab === 'inbox' ? (
            activeNotification ? (
              <div className="editor-paper notification-detail">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--wk-text-main)' }}>
                  {activeNotification.title}
                </h2>
                <p style={{ color: 'var(--wk-text-main)', fontSize: '1rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                  {activeNotification.description}
                </p>
                <p style={{ color: 'var(--wk-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                  {activeNotification.time}
                </p>
                
                <div className="notification-actions" style={{ display: 'flex', gap: '1rem' }}>
                  {activeNotification.type === 'invite' && (
                    <>
                      <button className="btn-primary" onClick={() => handleAcceptInvite(activeNotification.id)}>
                        Tham gia dự án
                      </button>
                      <button className="btn-secondary" onClick={() => handleDeclineInvite(activeNotification.id)}>
                        Từ chối
                      </button>
                    </>
                  )}
                  {activeNotification.type === 'declined' && !activeNotification.read && (
                    <button className="btn-primary" onClick={() => handleDismissNotification(activeNotification.id)}>
                      Đã hiểu
                    </button>
                  )}
                  {(activeNotification.type === 'edit_note' || activeNotification.type === 'comment') && (
                    <button className="btn-primary">Xem thay đổi</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Vui lòng chọn một thông báo để xem chi tiết</h3>
              </div>
            )
          ) : (
            activeNote ? (
              <div className="editor-paper" style={{ display: 'flex', flexDirection: 'column' }}>
                <input 
                  type="text"
                  className="editor-title-input" 
                  value={activeNote.title}
                  onChange={(e) => handleUpdateNote('title', e.target.value)}
                  placeholder="Nhập tiêu đề..."
                  disabled={activeNote.user_id !== currentUser.id && false}
                />
                
                <ReactQuill 
                  key={activeNote.id}
                  theme="snow"
                  value={activeNote.content || ''}
                  onChange={(value) => handleUpdateNote('content', value)}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, false] }],
                      ['bold', 'italic', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                  placeholder="Bắt đầu viết nội dung ghi chú ở đây..."
                  className="notiik-quill"
                />
              </div>
            ) : (
              <div className="empty-state">
                <h3>Vui lòng chọn hoặc tạo một ghi chú mới</h3>
              </div>
            )
          )}
        </div>
      </main>

      {/* MODAL CHIA SẺ DỰ ÁN */}
      {isShareModalOpen && (
        <div className="share-modal-overlay" onClick={() => setIsShareModalOpen(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--wk-text-main)' }}>Chia sẻ Dự án</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--wk-text-muted)', marginBottom: '1.5rem' }}>
              Nhập email của người mà bạn muốn mời vào cùng chỉnh sửa dự án này. Họ sẽ thấy dự án trong tab "Đã chia sẻ".
            </p>
            <input 
              type="email" 
              placeholder="Nhập email (vd: tungle@gmail.com)" 
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="share-email-input"
              onKeyDown={(e) => e.key === 'Enter' && handleShareNote()}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsShareModalOpen(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleShareNote} disabled={isSharing}>
                {isSharing ? 'Đang gửi...' : 'Chia sẻ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO DỰ ÁN */}
      {isProjectModalOpen && (
        <div className="share-modal-overlay" onClick={() => !isCreatingProject && setIsProjectModalOpen(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--wk-text-main)' }}>Tạo Dự án mới</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--wk-text-muted)', marginBottom: '1.5rem' }}>
              Nhập tên dự án để bắt đầu quản lý các ghi chú của bạn một cách có hệ thống.
            </p>
            <input 
              type="text" 
              placeholder="Nhập tên dự án (vd: Kế hoạch Q3)" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="share-email-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submitCreateProject()}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsProjectModalOpen(false)} disabled={isCreatingProject}>Hủy</button>
              <button className="btn-primary" onClick={submitCreateProject} disabled={isCreatingProject || !newProjectName.trim()}>
                {isCreatingProject ? 'Đang tạo...' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA GHI CHÚ */}
      {isDeleteModalOpen && (
        <div className="share-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--wk-text-main)' }}>Xác nhận xóa</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--wk-text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa ghi chú này vĩnh viễn không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Hủy</button>
              <button 
                className="btn-primary" 
                style={{ background: '#ef4444', borderColor: '#ef4444' }} 
                onClick={confirmDeleteNote}
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CHỌN ĐỊNH DẠNG XUẤT FILE */}
      {exportModalConfig.isOpen && (
        <div className="share-modal-overlay" onClick={() => !isExporting && setExportModalConfig({ isOpen: false, type: null })}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--wk-text-main)' }}>
              {exportModalConfig.type === 'note' ? 'Tải Ghi chú xuống' : 'Tải Dự án xuống (ZIP)'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--wk-text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Vui lòng chọn định dạng file mà bạn muốn xuất:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', padding: '0.75rem 1rem', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => handleExport('md')}
                disabled={isExporting}
              >
                📄 Markdown (.md) - Tốt nhất cho dân công nghệ
              </button>
              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', padding: '0.75rem 1rem', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => handleExport('doc')}
                disabled={isExporting}
              >
                📝 Microsoft Word (.doc) - Dễ dàng chỉnh sửa
              </button>
              <button 
                className="btn-secondary" 
                style={{ textAlign: 'left', padding: '0.75rem 1rem', width: '100%', justifyContent: 'flex-start' }}
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                📕 PDF (.pdf) - Chuẩn để in ấn và chia sẻ
              </button>
            </div>
            
            {isExporting && (
              <p style={{ marginTop: '1rem', color: 'var(--wk-accent-main)', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>
                ⏳ Đang xử lý file, vui lòng đợi chút...
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setExportModalConfig({ isOpen: false, type: null })} disabled={isExporting}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
