const fs = require('fs');
const file = 'd:/my-projects/Af1 Website/frontend/src/app/admin/popups/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<select value=\{editingPopup\.discountCode \|\| ''\}.*?<\/select>/s;

const newSelect = `<select value={editingPopup.discountCode || ''} onChange={e => setEditingPopup({ ...editingPopup, discountCode: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-orange-400 uppercase">
                              <option value="">-- None --</option>
                              {activeDiscounts.filter(d => !d.isAutomatic).map(d => {
                                let label = '';
                                if (d.type === 'percentage') label = d.value + '% Off';
                                else if (d.type === 'fixed_amount') label = '$' + d.value + ' Off';
                                else if (d.type === 'free_shipping') label = 'Free Shipping';
                                else if (d.type === 'bogo') label = 'BOGO';
                                else label = d.type;
                                return <option key={d._id} value={d.code}>{d.code} - {label}</option>
                              })}
                            </select>`;

content = content.replace(regex, newSelect);

fs.writeFileSync(file, content);
console.log('Done');
