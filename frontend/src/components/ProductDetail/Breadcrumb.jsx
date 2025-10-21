const Breadcrumb = ({ productName }) => {
    return (
        <nav className="breadcrumb">
            <span>Trang chủ</span>
            <span>›</span>
            <span>Sản phẩm</span>
            <span>›</span>
            <span className="current">{productName}</span>
        </nav>
    );
};

export default Breadcrumb;