import React, { useState, useRef, useEffect } from 'react';

export default function ImageAnnotationModal({ imageUrl, onSave, onClose }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [textInputs, setTextInputs] = useState([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [currentFontSize, setCurrentFontSize] = useState(24);

  // Khởi tạo Canvas bằng hình ảnh gốc
  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      // Đặt kích thước canvas bằng kích thước thật của ảnh
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  }, [imageUrl]);

  // Click vào ảnh để thêm khung chữ
  const handleCanvasClick = (e) => {
    if (!isAddingText) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    // Lấy tọa độ thật trên canvas (không phải trên màn hình)
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setTextInputs([...textInputs, { 
      id: Date.now(), 
      x, y, 
      text: '', 
      color: currentColor, 
      fontSize: currentFontSize 
    }]);
    
    // Tắt chế độ thêm chữ để họ gõ
    setIsAddingText(false);
  };

  const handleTextChange = (id, newText) => {
    setTextInputs(textInputs.map(t => t.id === id ? { ...t, text: newText } : t));
  };

  const handleRemoveText = (id) => {
    setTextInputs(textInputs.filter(t => t.id !== id));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Vẽ từng dòng chữ vào Canvas
    textInputs.forEach(t => {
      if (t.text.trim() === '') return;
      ctx.font = `${t.fontSize}px Arial`;
      ctx.fillStyle = t.color;
      // Dùng fillText để vẽ (cộng thêm chút padding cho đẹp)
      ctx.fillText(t.text, t.x, t.y + parseInt(t.fontSize)); 
    });

    // Xuất ra Base64 mới
    const newImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(newImageUrl);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🎨 Viết chữ lên trang PDF</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div style={styles.toolbar}>
          <button 
            style={{...styles.toolBtn, backgroundColor: isAddingText ? '#e5e7eb' : 'white'}}
            onClick={() => setIsAddingText(!isAddingText)}
          >
            {isAddingText ? '📍 Đang chọn vị trí (Click vào ảnh)...' : '✏️ Bấm để thêm Text'}
          </button>
          
          <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
            <label>Màu:</label>
            <input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} />
            
            <label style={{marginLeft: '1rem'}}>Cỡ chữ:</label>
            <input type="number" value={currentFontSize} onChange={e => setCurrentFontSize(e.target.value)} style={{width: '60px'}} />
          </div>
        </div>

        {/* Khung chứa ảnh và các ô gõ chữ nổi lên */}
        <div style={styles.editorContainer} ref={containerRef}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas 
              ref={canvasRef} 
              onClick={handleCanvasClick}
              style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc', cursor: isAddingText ? 'crosshair' : 'default' }}
            />
            
            {/* Hiển thị các ô gõ chữ */}
            {textInputs.map((t) => {
              // Tính toán tọa độ trên màn hình (vì canvas bị scale bởi maxWidth: 100%)
              const rect = canvasRef.current?.getBoundingClientRect();
              const scaleX = rect ? (rect.width / canvasRef.current.width) : 1;
              const scaleY = rect ? (rect.height / canvasRef.current.height) : 1;
              
              return (
                <div 
                  key={t.id} 
                  style={{
                    position: 'absolute',
                    left: `${t.x * scaleX}px`,
                    top: `${t.y * scaleY}px`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    value={t.text}
                    onChange={(e) => handleTextChange(t.id, e.target.value)}
                    placeholder="Gõ chữ vào đây..."
                    style={{
                      fontSize: `${t.fontSize * scaleX}px`, // Thu phóng chữ theo ảnh
                      color: t.color,
                      border: '2px dashed #000',
                      background: 'rgba(255, 255, 255, 0.7)',
                      padding: '4px',
                      minWidth: '150px',
                      outline: 'none'
                    }}
                  />
                  <button onClick={() => handleRemoveText(t.id)} style={{background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>X</button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={styles.footer}>
          <button style={{...styles.toolBtn, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 2rem'}} onClick={handleSave}>
            💾 Áp dụng và Lưu vào Ghi chú
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '1200px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  toolbar: {
    padding: '1rem 1.5rem',
    display: 'flex',
    gap: '1rem',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  toolBtn: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  editorContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem',
    backgroundColor: '#e5e7eb',
    textAlign: 'center'
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: 'white'
  }
};
