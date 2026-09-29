import { useState } from "react";
import { useNavigate } from "react-router-dom";


function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(event) {
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
          data.detail || "Неверный email или пароль"
        );
      }

      // Через эту страницу разрешаем вход
      // исключительно администратору.
      if (data.role !== "admin") {
        throw new Error(
          "Доступ разрешён только администратору системы."
        );
      }

      localStorage.setItem(
        "smartQalaUser",
        JSON.stringify(data)
      );

      navigate("/admin");

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        <div className="admin-login-mark">
          SMART QALA
        </div>

        <p className="admin-login-label">
          СЛУЖЕБНЫЙ ДОСТУП
        </p>

        <h1>
          Вход администратора
        </h1>

        <p className="admin-login-description">
          Панель управления служебными аккаунтами
          SMART QALA.
        </p>


        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Служебный email"
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
              placeholder="Пароль"
              required
            />
          </label>


          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Проверка..."
              : "Войти"}
          </button>

        </form>


        <p className="admin-login-warning">
          Доступ только для администратора системы.
        </p>

      </div>

    </div>
  );
}


export default AdminLogin;