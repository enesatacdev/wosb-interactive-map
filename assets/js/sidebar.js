/**
 * sidebar.js - Sidebar Açılır/Kapanır Toggle
 */

// Global Accordion Toggle
function toggleAccordion(header) {
    const section = header.closest('.accordion-section');
    if (section) {
        section.classList.toggle('active');
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const navItems = document.querySelectorAll(".nav-item");
  const sideSections = document.querySelectorAll(".side-section");

  if (!sidebar) return;

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const sectionId = item.getAttribute("data-section");

      // --- SPECIAL CASE: DRAW TOOL (Opens on the RIGHT) ---
      if (sectionId === "draw") {
        if (typeof DrawManager !== "undefined") {
          // Note: We no longer auto-close the left drawer here
          // to allow concurrent usage if desired.
          DrawManager.toggleDrawMode();
        }
        return;
      }

      // --- FOR LEFT DRAWER SECTIONS (Wind/Map/Trade/Regional) ---
      const targetSection = document.getElementById(
        `side-content-${sectionId}`,
      );

      // 1. If trying to open already open section -> Close
      if (item.classList.contains("active")) {
        sidebar.classList.add("collapsed");
        item.classList.remove("active");
        return;
      }

      // 2. Clear old states for left drawer icons only
      navItems.forEach((nav) => {
        if (nav.getAttribute("data-section") !== "draw") {
          nav.classList.remove("active");
        }
      });
      sideSections.forEach((sec) => sec.classList.remove("active"));

      // 3. Set new states
      item.classList.add("active");
      if (targetSection) targetSection.classList.add("active");

      // 4. Open Drawer
      sidebar.classList.remove("collapsed");
    });
  });
});
