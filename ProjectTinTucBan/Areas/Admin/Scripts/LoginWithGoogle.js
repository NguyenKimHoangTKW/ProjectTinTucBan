function signIn() {
    google.accounts.oauth2.initTokenClient({
        client_id: "678573924749-o17gesu5kjqachg7q87emoklr9ke020s.apps.googleusercontent.com", // New client ID
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: (response) => {
            if (response.access_token) {
                fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { "Authorization": `Bearer ${response.access_token}` }
                })
                    .then(res => res.json())
                    .then(userInfo => {
                        Session_Login(userInfo.email, userInfo.name);
                    })
                    .catch(error => {
                        Sweet_Alert("error", "Lỗi khi lấy thông tin từ Google");
                    });
            }
        },
        // Update redirect URI to match what's in Google Console
        redirect_uri: "https://localhost:44305/signin-google" // Updated redirect URI
    }).requestAccessToken();
}

function togglePassword(inputId) {
    var input = document.getElementById(inputId);
    var icon = event.currentTarget.querySelector('i');

    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// Điều chỉnh modal để phù hợp với thiết bị di động
$(document).ready(function () {
    if (window.innerWidth < 576) {
        // Điều chỉnh modal để phù hợp hơn với màn hình nhỏ
        $('.modal-dialog').css('margin', '10px');
        $('.verification-code').css('width', '35px');
    }

    // Đảm bảo các modal hiển thị đúng trên thiết bị di động
    $('.modal').on('shown.bs.modal', function () {
        $(this).css('padding-right', '0');
    });
});

async function Session_Login(email, fullname) {
    try {
        // Validate email domain
        if (!email.endsWith('@student.tdmu.edu.vn') && !email.endsWith('@tdmu.edu.vn')) {
            Sweet_Alert("error", "Gmail không hợp lệ."); 
            return;
        }

        // Phần còn lại không đổi
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
            // Save to sessionStorage to verify on Index page
            sessionStorage.setItem('loginInfo', JSON.stringify({
                email: email,
                name: fullname,
                role: res.idRole,
                time: new Date().toISOString()
            }));

            if (res.idRole == 4) {
                window.location.href = `/Admin/InterfaceAdmin/Index`;
            } else {
                Sweet_Alert("error", "Tài khoản bạn không thuộc phân quyền Admin...");
            }
        } else {
            Sweet_Alert("error", res.message || "Đăng nhập thất bại");
        }
    } catch (error) {
        Sweet_Alert("error", "Đã xảy ra lỗi khi đăng nhập");
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
            Sweet_Alert("error", "Đã xảy ra lỗi khi đăng xuất");
        }
    });
}

function logout() {
    Logout_Session();
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

$(document).ready(function () {
    // Xử lý đăng nhập bằng form
    $("#btnLogin").click(function (e) {
        e.preventDefault();

        const username = $("#username").val();
        const password = $("#password").val();

        if (!username || !password) {
            Sweet_Alert("error", "Vui lòng nhập đầy đủ thông tin đăng nhập");
            return;
        }

        // Validate email domain if it's an email
        if (username.includes('@')) {
            const domain = username.split('@')[1]; // Get the domain part
            if (domain !== "student.tdmu.edu.vn" && domain !== "tdmu.edu.vn") {
                Sweet_Alert("error", "Gmail không hợp lệ.");
                return;
            }
        }

        $.ajax({
            url: `/api/v1/admin/login`,
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
                    Sweet_Alert("error", response.message || "Đăng nhập không thành công");
                }
            },
            error: function (error) {
                Sweet_Alert("error", "Đã xảy ra lỗi khi đăng nhập");
            }
        });
    });

    // xử lý chức năng reset pass
    let verificationEmail = '';
    let verificationCode = '';
    let countdown;

    // Xử lý click nút quên mật khẩu
    $("#btnResetPassword").click(function (e) {
        e.preventDefault();
        $("#resetPasswordModal").modal('show');
    });

    //Xử lý gửi mã xác thực
    $("#btnSendVerificationCode").click(function () {
        const email = $("#resetEmail").val().trim();
        if (!email) {
            Swal.fire('Lỗi', 'Vui lòng nhập địa chỉ email', 'error');
            return;
        }
        if (!validateEmail(email)) {
            Swal.fire('Lỗi', 'Email không hợp lệ', 'error');
            return;
        }

        // Hiển thị đang xử lý
        Swal.fire({
            title: 'Đang xử lý',
            text: 'Đang gửi mã xác thực...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Gọi API
        $.ajax({
            url: '/api/v1/admin/send-verification-code',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email }),
            success: function (response) {
                if (response.success) {
                    verificationEmail = email;

                    // Lưu mã xác thực nếu API trả về
                    if (response.code) {
                        verificationCode = response.code;

                        // Hiển thị mã xác thực trong môi trường phát triển
                        Swal.fire({
                            title: 'Mã xác thực',
                            html: 'Mã xác thực của bạn đã được gửi tới gmail.',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            $("#resetPasswordModal").modal('hide');
                            $("#verificationCodeModal").modal('show');

                            // Focus và thiết lập bộ đếm thời gian
                            $('.verification-code:first').focus();
                            startCountdown(5 * 60);
                        });
                    } else {
                        // Trong môi trường production - không hiển thị mã
                        Swal.fire('Thành công', 'Mã xác thực đã được gửi đến email của bạn', 'success').then(() => {
                            $("#resetPasswordModal").modal('hide');
                            $("#verificationCodeModal").modal('show');

                            // Focus và thiết lập bộ đếm thời gian
                            $('.verification-code:first').focus();
                            startCountdown(5 * 60);
                        });
                    }
                } else {
                    Swal.fire('Lỗi', response.message || 'Email không tồn tại trong hệ thống', 'error');
                }
            },
            error: function (xhr, status, error) {
                Swal.fire('Lỗi', 'Đã xảy ra lỗi khi gửi mã xác thực', 'error');
            }
        });
    });

    // Xử lý nhập mã xác thực
    $(".verification-code").keyup(function (e) {
        if ($(this).val().length === 1) {
            $(this).next('.verification-code').focus();
        }
        if (e.key === "Backspace" && $(this).val().length === 0) {
            $(this).prev('.verification-code').focus();
        }
    });

    // Chỉ cho phép nhập số vào ô xác thực
    $(".verification-code").on("input", function () {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    // Xử lý xác thực mã
    $("#btnVerifyCode").click(function () {
        let enteredCode = '';
        $('.verification-code').each(function () {
            enteredCode += $(this).val();
        });

        if (enteredCode.length !== 6) {
            Swal.fire('Lỗi', 'Vui lòng nhập đủ 6 chữ số của mã xác thực', 'error');
            return;
        }

        // Gọi API để xác thực mã
        $.ajax({
            url: '/api/v1/admin/verify-code',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: verificationEmail,
                code: enteredCode
            }),
            success: function (response) {
                if (response.success) {
                    $("#verificationCodeModal").modal('hide');
                    $("#newPasswordModal").modal('show');
                    clearInterval(countdown); // Xóa bộ đếm thời gian
                } else {
                    Swal.fire('Lỗi', response.message || 'Mã xác thực không chính xác', 'error');
                }
            },
            error: function () {
                Swal.fire('Lỗi', 'Đã xảy ra lỗi khi xác thực mã', 'error');
            }
        });
    });

    // Xử lý đặt lại mật khẩu
    $("#btnResetNewPassword").click(function () {
        const newPassword = $("#newPassword").val();
        const confirmPassword = $("#confirmPassword").val();

        if (!newPassword) {
            Swal.fire('Lỗi', 'Vui lòng nhập mật khẩu mới', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            Swal.fire('Lỗi', 'Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        // Gọi API để đặt lại mật khẩu
        $.ajax({
            url: '/api/v1/admin/reset-password',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                email: verificationEmail,
                newPassword: newPassword
            }),
            success: function (response) {
                if (response.success) {
                    $("#newPasswordModal").modal('hide');
                    Swal.fire('Thành công', 'Mật khẩu đã được đặt lại thành công', 'success').then(() => {
                        // Làm mới trang đăng nhập
                        window.location.reload();
                    });
                } else {
                    Swal.fire('Lỗi', response.message || 'Không thể đặt lại mật khẩu', 'error');
                }
            },
            error: function () {
                Swal.fire('Lỗi', 'Đã xảy ra lỗi khi đặt lại mật khẩu', 'error');
            }
        });
    });

    // Xử lý gửi lại mã
    $("#resendCode").click(function (e) {
        e.preventDefault();

        $.ajax({
            url: '/api/v1/admin/resend-verification-code',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: verificationEmail }),
            success: function (response) {
                if (response.success) {
                    // Lưu mã xác thực nếu API trả về
                    if (response.code) {
                        verificationCode = response.code;

                        // Hiển thị mã mới
                        Swal.fire({
                            title: 'Mã xác thực',
                            html: 'Mã xác thực của bạn đã được gửi tới gmail của bạn',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });
                    } else {
                        Swal.fire('Thành công', 'Mã xác thực mới đã được gửi đến email của bạn', 'success');
                    }

                    // Reset các ô nhập mã
                    $('.verification-code').val('');
                    $('.verification-code:first').focus();

                    // Thiết lập lại bộ đếm thời gian
                    startCountdown(5 * 60);
                } else {
                    Swal.fire('Lỗi', response.message || 'Không thể gửi lại mã xác thực', 'error');
                }
            },
            error: function (xhr, status, error) {
                Swal.fire('Lỗi', 'Đã xảy ra lỗi khi gửi lại mã xác thực', 'error');
            }
        });
    });

    // Hàm đếm ngược thời gian
    function startCountdown(seconds) {
        let remainingTime = seconds;
        $("#resendCode").hide();

        clearInterval(countdown);

        countdown = setInterval(function () {
            remainingTime--;

            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;

            $("#timer").text(
                (minutes < 10 ? '0' : '') + minutes + ':' +
                (seconds < 10 ? '0' : '') + seconds
            );

            if (remainingTime <= 0) {
                clearInterval(countdown);
                $("#timer").text("00:00");
                $("#resendCode").show();
            }
        }, 1000);
    }

    // Hàm kiểm tra email hợp lệ
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
});