const SelectAllBox = ({ isChecked, totalItems, onSelectAll }) => {
    return (
        <div className="select-all-box">
            <label className="select-all-label">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="checkbox"
                />
                <span>Chọn tất cả ({totalItems} sản phẩm)</span>
            </label>
        </div>
    );
};

export default SelectAllBox;