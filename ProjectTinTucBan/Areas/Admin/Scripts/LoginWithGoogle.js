function handleCredentialResponse(response) {
    let info = JSON.parse(atob(response.credential.split('.')[1]));
    Session_Login(info.email, info.name);
}

function signIn() {
    google.accounts.oauth2.initTokenClient({
        client_id: "86275080034-flfnhk84et6tdg56qgi6obp53rv0pgiq.apps.googleusercontent.com", // New client ID
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: (response) => {
            if (response.access_token) {
                fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { "Authorization": `Bearer ${response.access_token}` }
                })
                    .then(res => res.json())
                    .then(userInfo => {
                        console.log("Google user info:", userInfo);
                        Session_Login(userInfo.email, userInfo.name);
                    })
                    .catch(error => {
                        showToast("error", "Lỗi khi lấy thông tin từ Google");
                        console.error("Error fetching Google user info:", error);
                    });
            }
        },
        // Update redirect URI to match what's in Google Console
        redirect_uri: "https://localhost:44305/signin-google" // Updated redirect URI
    }).requestAccessToken();
}

async function Session_Login(email, fullname) {
    try {
        // Validate email domain
        if (!email.endsWith('@student.tdmu.edu.vn') && !email.endsWith('@tdmu.edu.vn')) {
            console.log("Invalid email domain:", email);
            Sweet_Alert("error", "Gmail không hợp lệ.");
            return;
        }

        const res = await $.ajax({
            url: "/api/v1/admin/login-with-google",
            type: 'POST',
            dataType: 'JSON',
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                name: fullname,
            }),
        });


        if (res.success) {
            console.log("Login successful! Role:", res.idRole);
            
            // Save to sessionStorage to verify on Index page
            sessionStorage.setItem('loginInfo', JSON.stringify({
                email: email,
                name: fullname,
                role: res.idRole,
                time: new Date().toISOString()
            }));
            
            if (res.idRole == 4) {
                console.log("Role permitted, redirecting to Index...");
                window.location.href = `/Admin/InterfaceAdmin/Index`;
            } else {
                console.log("Access denied - Role:", res.idRole);
                showToast("error", "Tài khoản bạn không thuộc phân quyền Admin...");
            }
        } else {
            showToast("error", res.message || "Đăng nhập thất bại");
        }
    } catch (error) {
        console.error("Login error:", error);
        showToast("error", "Đã xảy ra lỗi khi đăng nhập");
    }
}

function Logout_Session() {
    $.ajax({
        url: "/api/v1/admin/clear_session", // Fixed URL
        type: 'POST',
        success: function (res) {
            if (res.success) {
                localStorage.removeItem('authInfo');
                location.replace("/Admin/InterfaceAdmin/Login");
            }
        },
        error: function (error) {
            console.error("Logout error:", error);
            showToast("error", "Đã xảy ra lỗi khi đăng xuất");
        }
    });
}

function logout() {
    Logout_Session();
}

function showToast(icon, title) {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    Toast.fire({
        icon: icon,
        title: title
    });
}


    $(document).ready(function () {
        // Xử lý đăng nhập bằng form
        $("#btnLogin").click(function (e) {
            e.preventDefault();

            const username = $("#username").val();
            const password = $("#password").val();

            if (!username || !password) {
                showToast("error", "Vui lòng nhập đầy đủ thông tin đăng nhập");
                return;
            }

            // Validate email domain if it's an email
            if (username.includes('@')) {
                const domain = username.split('@')[1]; // Get the domain part
                if (domain !== "student.tdmu.edu.vn" && domain !== "tdmu.edu.vn") {
                    showToast("error", "Gmail không hợp lệ.");
                    return;
                }
            }

            $.ajax({
                url: `/api/v1/admin//login`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    Username: username,
                    Password: password
                }),
                success: function (response) {
                    if (response.success) {
                        window.location.href = "/Admin/InterfaceAdmin/Index";
                    } else {
                        showToast("error", response.message || "Đăng nhập không thành công");
                    }
                },
                error: function (error) {
                    showToast("error", "Đã xảy ra lỗi khi đăng nhập");
                }
            });
        });
    });

    function showToast(icon, title) {
        const Toast = Swal.mixin({
        toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
            didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
            }
        });
    Toast.fire({
        icon: icon,
    title: title
        });
    }

// Add the SweetAlert function
function Sweet_Alert(icon, title) {
    Swal.fire({
        position: "center",
        icon: icon,
        title: title,
        showConfirmButton: false,
        timer: 10000
    });
}