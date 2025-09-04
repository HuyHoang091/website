import React from 'react';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header/Header1';

const App = () => 
// {
//     const [htmlContent, setHtmlContent] = useState("");

//     useEffect(() => {
//         fetch("./routes/demo.html")
//         .then((res) => res.text())
//         .then((data) => setHtmlContent(data));
//     }, []);

//     return (
//         <div>
//             <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
//             <Header />
//             <AppRoutes />
//         </div>
//     );
// }
<div>
    <Header />
    <AppRoutes />
</div>

export default App;