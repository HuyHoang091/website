// const AmountInput = ({ amount, onChange }) => {
//     const handleChange = (e) => {
//         const value = parseFloat(e.target.value) || 0;
//         onChange(value);
//     };

//     return (
//         <div className="form-group">
//             <label className="form-label" htmlFor="amountVND">
//                 Số tiền cần thanh toán
//             </label>
//             <div className="input-wrapper">
//                 <span className="currency-symbol">₫</span>
//                 <input
//                     type="number"
//                     id="amountVND"
//                     className="form-input"
//                     value={amount}
//                     onChange={handleChange}
//                     min="1000"
//                     step="1000"
//                     placeholder="Nhập số tiền VND"
//                 />
//             </div>
//         </div>
//     );
// };

// export default AmountInput;