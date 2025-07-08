type ToastOptions = {
  duration?: number;
};

export function showToastU(message: string, options: ToastOptions = {}): void {

  let toastWrapper = document.getElementById("toast-wrapper");
  if (!toastWrapper) {
    toastWrapper = document.createElement("div");
    toastWrapper.id = "toast-wrapper";
    toastWrapper.style.position = "fixed";
    toastWrapper.style.zIndex = "9999";
    toastWrapper.style.top = "1rem";
    toastWrapper.style.left = "50%";
    toastWrapper.style.transform = "translateX(-50%)";
    toastWrapper.style.display = "flex";
    toastWrapper.style.flexDirection = "column";
    toastWrapper.style.gap = "0.5rem";
    document.body.appendChild(toastWrapper); 
  }

  const container = document.createElement("div");
  container.className =
    "flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800";
  container.setAttribute("role", "alert");

  container.innerHTML = `
    <div class="text-sm font-normal">
      ${message}
    </div>
    <div class="flex items-center ms-auto space-x-2 rtl:space-x-reverse">
      <button type="button" class="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" aria-label="Close">
        <span class="sr-only">Close</span>
        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6  6M7 7l6-6M7 7l-6 6"/>
        </svg>
      </button>
    </div>
  `;

  toastWrapper.appendChild(container);

  setTimeout(() => {
    container.style.opacity = "0";
    container.style.transition = "opacity 0.3s ease";
    setTimeout(() => container.remove(), 300);
  }, options.duration || 4000);

  const closeBtn = container.querySelector('[aria-label="Close"]') as HTMLButtonElement | null;
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      container.remove();
    });
  }
}
