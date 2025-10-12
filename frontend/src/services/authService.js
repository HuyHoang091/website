export async function login(username, password) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
    let data = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await res.json().catch(() => ({}));
    } else {
        data.message = await res.text();
    }

    if (!res.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
    }

    localStorage.setItem("tokenJWT", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    const role = data.user.role;
    // if (role === 'SALER') {
    //     window.location.href = "/test";
    // } else {
    //     window.location.href = "/";
    // }
    return role;
}

async function register(username, email) {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email })
    });
    let data = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await res.json().catch(() => ({}));
    } else {
        data.message = await res.text();
    }

    if (!res.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
    }
    return data;
}