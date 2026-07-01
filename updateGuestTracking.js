const fs = require('fs');
const file1 = 'd:/my-projects/Af1 Website/frontend/src/app/checkout/CheckoutPageClient.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(
  '          if (data.ok) {\n            trackStep(\'completed\');',
  '          if (data.ok) {\n            if (!isAuthenticated && shippingForm.email) localStorage.setItem(\'af1_guest_email\', shippingForm.email);\n            trackStep(\'completed\');'
);

content1 = content1.replace(
  '          // Note: For live PayPal, we would clear the cart AFTER capture success',
  '          if (!isAuthenticated && shippingForm.email) localStorage.setItem(\'af1_guest_email\', shippingForm.email);\n          // Note: For live PayPal, we would clear the cart AFTER capture success'
);

fs.writeFileSync(file1, content1);

const file2 = 'd:/my-projects/Af1 Website/frontend/src/components/cart/UnlockedRewards.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(
  'apiClient.post(\'/api/discounts/evaluate-automatic\', { items: payload }).then(res => {',
  'const guestEmail = typeof window !== \'undefined\' ? localStorage.getItem(\'af1_guest_email\') : undefined;\n    apiClient.post(\'/api/discounts/evaluate-automatic\', { items: payload, guestEmail }).then(res => {'
);

fs.writeFileSync(file2, content2);
console.log('Done');
