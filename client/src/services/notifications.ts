type NotificationType = 'info' | 'success' | 'warning' | 'error';

export function showNotification(message: string, type: NotificationType = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `game-notification ${type}`;
  notification.textContent = message;

  // Add to notification container (create if doesn't exist)
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Add notification to container
  container.appendChild(notification);

  // Remove after animation
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
      if (container?.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
}
