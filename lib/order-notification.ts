// lib/order-notification.ts
export function formatOrderNotification(order: any, userEmail: string, cart: any[]) {
  let message = `🛒 <b>НОВЫЙ ЗАКАЗ НА JAPRIX!</b>\n\n`;
  message += `👤 <b>Покупатель:</b> ${userEmail}\n`;
  message += `📦 <b>Номер заказа:</b> #${order.id}\n`;
  message += `💰 <b>Общая сумма:</b> ¥${order.total.toLocaleString()}\n`;
  message += `📅 <b>Дата:</b> ${new Date().toLocaleString('ru-RU')}\n\n`;
  message += `📋 <b>Состав заказа:</b>\n`;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    // Определяем маркетплейс
    const marketplaceEmoji = item.marketplace === 'yahoo' ? '💜' : '🛍️';
    const marketplaceName = item.marketplace === 'yahoo' ? 'Yahoo Shopping' : 'Rakuten';

    message += `\n${index + 1}. <b>${item.title}</b>\n`;
    message += `   ${marketplaceEmoji} <b>Маркетплейс:</b> ${marketplaceName}\n`;
    if (item.itemUrl) {
      message += `   🔗 <a href="${item.itemUrl}">Ссылка на товар</a>\n`;
    }
    message += `   💰 Цена: ¥${item.price.toLocaleString()}\n`;
    
    // ОПЦИИ ТОВАРА - проверяем поле options
    if (item.options && Object.keys(item.options).length > 0) {
      message += `   ⚙️ <b>Выбранные опции:</b>\n`;
      Object.entries(item.options).forEach(([key, value]) => {
        message += `      • ${key}: ${value}\n`;
      });
    }
    
    if (item.image && item.image !== "/no-image.png") {
      message += `   🖼️ Фото: <a href="${item.image}">ссылка</a>\n`;
    }
    
    if (item.quantity > 1) {
      message += `   📦 Количество: ${item.quantity}\n`;
    }
    
    message += `   🧮 Сумма: ¥${itemTotal.toLocaleString()}\n`;
  });

  message += `\n⚠️ <i>Дополнительные расходы на доставку могут применяться после прибытия на склад</i>`;

  return message;
}