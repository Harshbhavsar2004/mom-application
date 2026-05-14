import { useEffect } from "react";
function Login() {
    useEffect(() => {
        const redirectUrl = encodeURIComponent(window.location.origin + "/app/index.html#/dashboard");
        window.location.href = window.origin + "/__catalyst/auth/login";
    }, []);
    return null;
}
export default Login;