const searchForm = document.getElementById("smartSearch");
const navItems = document.querySelectorAll(".nav-item");
const globalSearch = document.querySelector(".global-search input");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
  });
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = searchForm.querySelector("button");
  const originalText = button.innerHTML;
  button.innerHTML = "<span>⌁</span> Buscando";
  button.disabled = true;

  window.setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
    document.querySelector(".opportunities-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 650);
});

globalSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  document.querySelector(".opportunities-panel").scrollIntoView({ behavior: "smooth", block: "start" });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
