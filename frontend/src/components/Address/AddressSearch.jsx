import { useState, useRef, useEffect } from 'react';

const SearchIcon = () => (
    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const AddressSearch = ({ onAddressSelect, selectedAddress }) => {
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const timeoutRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (selectedAddress) {
            setSearchValue(selectedAddress);
        }
    }, [selectedAddress]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (!value.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5`
                );
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 500);
    };

    const handleSuggestionClick = (item) => {
        setSearchValue(item.display_name);
        setSuggestions([]);
        setShowSuggestions(false);
        onAddressSelect(item.display_name, item.lat, item.lon);
    };

    return (
        <div className="search-wrapper">
            <div className="search-container" ref={containerRef}>
                <SearchIcon />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm địa chỉ (VD: 123 Trần Hưng Đạo, Quận 1, TP.HCM)"
                    value={searchValue}
                    onChange={handleInputChange}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                        {suggestions.map((item, index) => (
                            <li
                                key={index}
                                className="suggestion-item"
                                onClick={() => handleSuggestionClick(item)}
                            >
                                {item.display_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default AddressSearch;