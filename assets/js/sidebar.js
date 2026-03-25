/**
 * sidebar.js - Sidebar Açılır/Kapanır Toggle
 */

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (!sidebar || !toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        
        // Toggle butonunun konumunu güncelle
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.style.left = '16px';
            toggleBtn.innerHTML = '☰';
        } else {
            toggleBtn.style.left = '';
            toggleBtn.innerHTML = '✕';
        }

        // Harita viewport'u sidebar değişiminden sonra yeniden boyutlandırıldığı için
        // map.js'deki fitMapToViewport'u tetikle
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 350);
    });

    // Başlangıçta açık durumda ikon
    toggleBtn.innerHTML = '✕';
});
