import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Login() {
  const navigate = useNavigate();

  // login | register
  const [mode, setMode] = useState("login");

  // resident | government
  const [selectedRole, setSelectedRole] =
    useState("resident");

  const [name, setName] = useState("");

  const [email, setEmail] =
    useState("resident@smartqala.kz");

  const [password, setPassword] =
    useState("resident123");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =====================================================
  // SWITCH LOGIN / REGISTER
  // =====================================================

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
    setName("");
    setConfirmPassword("");

    if (newMode === "login") {
      setSelectedRole("resident");
      setEmail("resident@smartqala.kz");
      setPassword("resident123");
    } else {
      setEmail("");
      setPassword("");
    }
  }


  // =====================================================
  // SELECT LOGIN ROLE
  // =====================================================

  function selectRole(role) {
    setSelectedRole(role);
    setError("");

    if (role === "resident") {
      setEmail("resident@smartqala.kz");
      setPassword("resident123");
    } else {
      setEmail("government@smartqala.kz");
      setPassword("government123");
    }
  }


  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Неверный email или пароль"
        );
      }


      // Проверяем, что пользователь
      // выбрал правильный тип аккаунта.
      if (data.role !== selectedRole) {
        if (selectedRole === "resident") {
          throw new Error(
            "Этот аккаунт не является аккаунтом жителя."
          );
        }

        throw new Error(
          "Этот аккаунт не является аккаунтом сотрудника."
        );
      }


      localStorage.setItem(
        "smartQalaUser",
        JSON.stringify(data)
      );


      if (data.role === "government") {
        navigate("/government");
      } else {
        navigate("/ideas");
      }

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  // =====================================================
  // REGISTER
  // =====================================================

  async function handleRegister(event) {
    event.preventDefault();

    setError("");


    if (password !== confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }


    if (password.length < 6) {
      setError(
        "Пароль должен содержать минимум 6 символов."
      );

      return;
    }


    setLoading(true);


    try {
      const response = await fetch(
        "http://127.0.0.1:8000/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Не удалось создать аккаунт."
        );
      }


      // Backend автоматически создаёт
      // пользователя с ролью resident.

      localStorage.setItem(
        "smartQalaUser",
        JSON.stringify(data)
      );


      navigate("/ideas");

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="login-page">

      <div className="login-container">


        {/* TITLE */}

        <div className="login-heading">

          <div className="login-eyebrow">
            SMART QALA
          </div>

          <h1>
            {mode === "login"
              ? "Вход в систему"
              : "Создание аккаунта"}
          </h1>

          <p>
            {mode === "login"
              ? "Войдите, чтобы работать с цифровыми инициативами города."
              : "Создайте аккаунт жителя, чтобы предлагать инициативы и отслеживать их рассмотрение."}
          </p>

        </div>


        {/* LOGIN / REGISTER TABS */}

        <div className="auth-tabs">

          <button
            type="button"
            className={
              mode === "login"
                ? "auth-tab auth-tab-active"
                : "auth-tab"
            }
            onClick={() =>
              switchMode("login")
            }
          >
            Вход
          </button>


          <button
            type="button"
            className={
              mode === "register"
                ? "auth-tab auth-tab-active"
                : "auth-tab"
            }
            onClick={() =>
              switchMode("register")
            }
          >
            Регистрация
          </button>

        </div>


        {/* ================================
            LOGIN
        ================================= */}

        {mode === "login" && (
          <>

            <div className="role-selector">

              <button
                type="button"
                className={
                  `role-card ${
                    selectedRole === "resident"
                      ? "role-card-active"
                      : ""
                  }`
                }
                onClick={() =>
                  selectRole("resident")
                }
              >

                <div className="role-icon">
                  01
                </div>

                <div>
                  <h3>
                    Житель
                  </h3>

                  <p>
                    Предлагайте цифровые инициативы
                    и следите за их рассмотрением.
                  </p>
                </div>

              </button>


              <button
                type="button"
                className={
                  `role-card ${
                    selectedRole === "government"
                      ? "role-card-active"
                      : ""
                  }`
                }
                onClick={() =>
                  selectRole("government")
                }
              >

                <div className="role-icon">
                  02
                </div>

                <div>
                  <h3>
                    Сотрудник госоргана
                  </h3>

                  <p>
                    Рассматривайте поступившие
                    инициативы и управляйте статусами.
                  </p>
                </div>

              </button>

            </div>


            <form
              className="login-form"
              onSubmit={handleLogin}
            >

              <div className="login-form-title">
                {selectedRole === "resident"
                  ? "Вход для жителя"
                  : "Вход для сотрудника"}
              </div>


              <label>
                Email

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </label>


              <label>
                Пароль

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </label>


              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}


              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading
                  ? "Входим..."
                  : "Войти в SMART QALA"}
              </button>


              <div className="demo-notice">
                Демонстрационная авторизация для MVP
              </div>

            </form>

          </>
        )}


        {/* ================================
            REGISTER
        ================================= */}

        {mode === "register" && (

          <form
            className="login-form register-form"
            onSubmit={handleRegister}
          >

            <div className="login-form-title">
              Регистрация жителя
            </div>


            <div className="register-info">

              <div className="register-info-icon">
                ✓
              </div>

              <div>
                <strong>
                  Аккаунт жителя
                </strong>

                <p>
                  После регистрации вы сможете
                  предлагать инициативы и отслеживать
                  статус их рассмотрения.
                </p>
              </div>

            </div>


            <label>
              Имя

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Введите ваше имя"
                minLength="2"
                required
              />
            </label>


            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="example@email.com"
                required
              />
            </label>


            <label>
              Пароль

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Минимум 6 символов"
                minLength="6"
                required
              />
            </label>


            <label>
              Повторите пароль

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Повторите пароль"
                minLength="6"
                required
              />
            </label>


            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? "Создаём аккаунт..."
                : "Создать аккаунт"}
            </button>


            <div className="government-registration-note">

              <strong>
                Вы сотрудник госоргана?
              </strong>

              <span>
                Аккаунты сотрудников создаются
                администратором SMART QALA.
              </span>

            </div>

          </form>

        )}

      </div>

    </div>
  );
}


export default Login;