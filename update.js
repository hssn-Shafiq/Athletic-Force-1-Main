const fs = require('fs');
const file = 'd:/my-projects/Af1 Website/frontend/src/app/checkout/CheckoutPageClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  applied,\n  onRemove,\n}: {\n  cartTotal: number;\n  onApply: (d: AppliedDiscount) => void;\n  applied: AppliedDiscount | null;\n  onRemove: () => void;\n}) => {',
  '  applied,\n  onRemove,\n  guestEmail,\n}: {\n  cartTotal: number;\n  onApply: (d: AppliedDiscount) => void;\n  applied: AppliedDiscount | null;\n  onRemove: () => void;\n  guestEmail?: string;\n}) => {'
);

content = content.replace(
  '        const { data } = await apiClient.post(' + "'/api/discounts/validate'" + ', {\n          code: code.trim().toUpperCase(),\n          cartTotal,\n        });',
  '        const { data } = await apiClient.post(' + "'/api/discounts/validate'" + ', {\n          code: code.trim().toUpperCase(),\n          cartTotal,\n          guestEmail,\n        });'
);

content = content.replace(
  '  onRemoveDiscount,\n  step,\n}: {\n  isSettingsLoading: boolean;\n  settings: StoreSettings | null;\n  appliedDiscount: AppliedDiscount | null;\n  onApplyDiscount: (d: AppliedDiscount) => void;\n  onRemoveDiscount: () => void;\n  step: number;\n}) => {',
  '  onRemoveDiscount,\n  step,\n  guestEmail,\n}: {\n  isSettingsLoading: boolean;\n  settings: StoreSettings | null;\n  appliedDiscount: AppliedDiscount | null;\n  onApplyDiscount: (d: AppliedDiscount) => void;\n  onRemoveDiscount: () => void;\n  step: number;\n  guestEmail?: string;\n}) => {'
);

content = content.replace(
  '              <CouponInput\n                cartTotal={totalPrice}\n                onApply={onApplyDiscount}\n                applied={appliedDiscount}\n                onRemove={onRemoveDiscount}\n              />',
  '              <CouponInput\n                cartTotal={totalPrice}\n                onApply={onApplyDiscount}\n                applied={appliedDiscount}\n                onRemove={onRemoveDiscount}\n                guestEmail={guestEmail}\n              />'
);

content = content.replace(
  '            onRemoveDiscount={() => setAppliedDiscount(null)}\n            step={step}\n          />\n        </div>\n      </div>\n    </div>',
  '            onRemoveDiscount={() => setAppliedDiscount(null)}\n            step={step}\n            guestEmail={shippingForm.email}\n          />\n        </div>\n      </div>\n    </div>'
);

fs.writeFileSync(file, content);
console.log('Done');
