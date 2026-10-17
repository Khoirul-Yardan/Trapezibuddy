// confirm-modal.js
export function showConfirmModal(message, onConfirm) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.25)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;

  // Create modal
  const modal = document.createElement('div');
  modal.style.background = '#fff';
  modal.style.borderRadius = '12px';
  modal.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
  modal.style.padding = '28px 32px 20px 32px';
  modal.style.minWidth = '320px';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';

  // Message
  const msg = document.createElement('div');
  msg.textContent = message;
  msg.style.fontSize = '16px';
  msg.style.marginBottom = '24px';
  msg.style.textAlign = 'center';
  modal.appendChild(msg);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '16px';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Batal';
  btnCancel.style.padding = '8px 22px';
  btnCancel.style.border = 'none';
  btnCancel.style.borderRadius = '6px';
  btnCancel.style.background = '#eee';
  btnCancel.style.color = '#444';
  btnCancel.style.fontWeight = 'bold';
  btnCancel.style.cursor = 'pointer';
  btnCancel.onclick = () => {
    document.body.removeChild(overlay);
  };

  const btnOk = document.createElement('button');
  btnOk.textContent = 'Keluar';
  btnOk.style.padding = '8px 22px';
  btnOk.style.border = 'none';
  btnOk.style.borderRadius = '6px';
  btnOk.style.background = '#E57373';
  btnOk.style.color = '#fff';
  btnOk.style.fontWeight = 'bold';
  btnOk.style.cursor = 'pointer';
  btnOk.onclick = () => {
    document.body.removeChild(overlay);
    onConfirm?.();
  };

  btnRow.appendChild(btnCancel);
  btnRow.appendChild(btnOk);
  modal.appendChild(btnRow);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
