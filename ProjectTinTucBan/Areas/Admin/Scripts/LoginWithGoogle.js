function signIn() {
    google.accounts.oauth2.initTokenClient({
        client_id: "678573924749-o17gesu5kjqachg7q87emoklr9ke020s.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
        callback: (response) => {
            if (response.access_token) {
                fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { "Authorization": `Bearer ${response.access_token}` }
                })
                    .then(res => res.json())
                    .then(userInfo => {
                        // Log all name-related fields for debugging
                        console.log("Full Google response:", userInfo);

                        // Call Session_Login with all name fields
                        Session_Login(
                            userInfo.email,
                            userInfo.name || "",           // Full name as fallback
                            userInfo.given_name || "",     // First name
                            userInfo.family_name || ""     // Last name
                        );
                    })
                    .catch(error => {
                        Sweet_Alert("error", "Lỗi khi lấy thông tin từ Google");
                    });
            }
        },
        redirect_uri: "https://localhost:44305/signin-google"
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



async function Session_Login(email, fullname, given_name, family_name) {
    try {
        // Validate email domain
        if (!email.endsWith('@student.tdmu.edu.vn') && !email.endsWith('@tdmu.edu.vn')) {
            Sweet_Alert("error", "Gmail không hợp lệ.");
            return;
        }

        // Gọi API đăng nhập Google
        const res = await $.ajax({
            url: "/api/v1/admin/login-with-google",
            type: 'POST',
            dataType: 'JSON',
            contentType: "application/json",
            data: JSON.stringify({
                email: email,
                name: fullname,
                given_name: given_name,
                family_name: family_name
            }),
        });

        if (res.success) {
            // Đăng nhập thành công
            sessionStorage.setItem('loginInfo', JSON.stringify({
                email: email,
                name: fullname,
                role: res.idRole,
                userId: res.idUser,
                userId: res.userId,
                time: new Date().toISOString()
            }));

            // Chuyển hướng dựa trên vai trò
            if (res.idRole == 4 || res.idRole == 1) {
                window.location.href = `/Admin/InterfaceAdmin/Index`;
            } else {
                Sweet_Alert("error", "Tài khoản bạn không thuộc phân quyền Admin...");
            }
        } else {
            // Xử lý các trường hợp đăng nhập thất bại
            if (res.isLocked) {
                if (res.isPermanent) {
                    // Tài khoản bị khóa vĩnh viễn
                    Sweet_Alert("error", "Tài khoản của bạn đã bị khóa vĩnh viễn. Vui lòng liên hệ quản trị viên.");
                } else if (res.remainingSeconds) {
                    // Tài khoản bị khóa tạm thời
                    const currentTime = Math.floor(Date.now() / 1000);
                    const unlockTime = currentTime + res.remainingSeconds;
                    showLockCountdown(unlockTime);
                    Sweet_Alert("error", res.message);
                } else {
                    Sweet_Alert("error", "Tài khoản bạn bị khóa tạm thời.");
                }
            } else {
                // Các lỗi khác
                Sweet_Alert("error", res.message || "Đăng nhập thất bại");
            }
        }
    } catch (error) {
        console.error("Login error:", error);
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

// Function to check account lock status on page load
function checkAccountLockStatus() {
    // Get stored username if available (from a previous login attempt)
    const storedUsername = localStorage.getItem('lastLoginUsername');

    if (storedUsername) {
        $.ajax({
            url: `/api/v1/admin/check-account-lock`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ username: storedUsername }),
            success: function (response) {
                if (response.success && response.isLocked) {
                    if (response.isPermanent) {
                        // Show permanent lock message
                        $(".password-container").after(`
                            <div id="lockCountdownContainer" class="alert alert-danger mt-2">
                                <i class="fas fa-lock mr-2"></i>
                                <span>Tài khoản bị khóa vĩnh viễn. Vui lòng liên hệ quản trị viên.</span>
                            </div>
                        `);
                    } else if (response.unlockTime) {
                        // Show temporary lock with countdown
                        showLockCountdown(response.unlockTime, response.countPasswordFail || 0);
                    }

                    // Pre-fill the username field
                    $("#username").val(storedUsername);
                }
            }
        });
    }
}

// Improved showLockCountdown function
let currentCountdownInterval = null;
function showLockCountdown(unlockTimeValue, failedAttempts) {

    $("#btnLogin").prop("disabled", true).addClass("disabled");
    // xoá bộ đếm hiện có
    if (currentCountdownInterval) {
        clearInterval(currentCountdownInterval);
        currentCountdownInterval = null;
    }

    // Remove any existing lock container
    $("#lockCountdownContainer").remove();

    // Create new countdown container
    $(".password-container").after(`
        <div id="lockCountdownContainer" class="alert alert-danger mt-2">
            <i class="fas fa-lock mr-2"></i>
            <span>Tài khoản bị khóa tạm thời. Sẽ mở khóa sau: </span>
            <div id="lockCountdown" class="font-weight-bold">Đang tính toán...</div>
            ${failedAttempts > 0 ? `<div class="mt-1">Số lần đăng nhập thất bại: ${failedAttempts}</div>` : ''}
        </div>
    `);

    // Parse the unlock time correctly - ensure it's a number
    let unlockTime;

    try {
        // Convert to number if it's a string
        if (typeof unlockTimeValue === 'string') {
            unlockTimeValue = parseInt(unlockTimeValue, 10);
        }

        // Check if it's a Unix timestamp (seconds since epoch)
        if (unlockTimeValue && unlockTimeValue.toString().length === 10) {
            unlockTime = unlockTimeValue * 1000; // Convert to milliseconds
        } else {
            unlockTime = unlockTimeValue;
        }
    } catch (e) {
        // Default to 15 minutes from now as fallback
        unlockTime = Date.now() + (15 * 60 * 1000);
    }

    // Set up the countdown timer
    const updateCountdown = setInterval(function () {
        const now = Date.now();
        const timeLeft = unlockTime - now;

        if (timeLeft <= 0) {
            clearInterval(updateCountdown);
            $("#lockCountdownContainer").html(`
                <div class="alert alert-success">
                    <i class="fas fa-unlock mr-2"></i>
                    <span>Tài khoản đã được mở khóa. Bạn có thể đăng nhập lại.</span>
                </div>
            `);
            setTimeout(() => $("#lockCountdownContainer").fadeOut('slow'), 5000);

            // Kích hoạt lại nút đăng nhập
            $("#btnLogin").prop("disabled", false).removeClass("disabled");

            return;
        }

        // Time calculations - ensure all positive numbers
        const hours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
        const minutes = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));
        const seconds = Math.max(0, Math.floor((timeLeft % (1000 * 60)) / 1000));

        // Display countdown with zero-padding
        $("#lockCountdown").text(
            `${hours}h ${minutes}m ${seconds}s`
        );
    }, 1000);

    // Show initial alert
    Sweet_Alert("error", "Tài khoản bạn bị khoá tạm thời");
}

$(document).ready(function () {
    // Thêm enter key event cho username và password
    $("#username, #password").keypress(function (e) {
        if (e.which === 13) {  // 13 is the Enter key code
            e.preventDefault();
            $("#btnLogin").click();
        }
    });

    checkAccountLockStatus();


    // Modify the btnLogin click handler to save the username
    $("#btnLogin").click(function (e) {
        e.preventDefault();

        const username = $("#username").val();
        const password = $("#password").val();

        if (!username || !password) {
            Sweet_Alert("error", "Vui lòng nhập đầy đủ thông tin đăng nhập");
            return;
        }

        // Save username for lock checking on future page loads
        localStorage.setItem('lastLoginUsername', username);

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
                    // Check if account is locked
                    if (response.isLocked) {
                        if (response.isPermanent) {
                            // Permanent lock
                            $("#lockCountdownContainer").remove(); // Remove any existing countdown
                            $(".password-container").after(`
                            <div id="lockCountdownContainer" class="alert alert-danger mt-2">
                                <i class="fas fa-lock mr-2"></i>
                                <span>Tài khoản bị khóa vĩnh viễn. Vui lòng liên hệ quản trị viên.</span>
                            </div>
                        `);
                            Sweet_Alert("error", "Tài khoản bị khóa vĩnh viễn");
                        } else {
                            // For temporary locks
                            if (response.unlockTime) {
                                showLockCountdown(response.unlockTime, response.countPasswordFail || 0);
                            } else if (response.remainingSeconds) {
                                const currentTime = Math.floor(Date.now() / 1000);
                                const unlockTime = currentTime + response.remainingSeconds;
                                showLockCountdown(unlockTime, response.countPasswordFail || 0);
                            }
                        }
                    } else {
                        // Handle other login failure reasons
                        Sweet_Alert("error", response.message || "Đăng nhập không thành công");
                    }
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