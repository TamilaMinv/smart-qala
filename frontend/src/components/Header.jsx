import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../LanguageContext.jsx";


function Header() {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const savedUser = localStorage.getItem(
    "smartQalaUser"
  );

  const user = savedUser
    ? JSON.parse(savedUser)
    : null;


  function handleLogout() {
    localStorage.removeItem(
      "smartQalaUser"
    );

    if (user?.role === "admin") {
      navigate("/admin-login");
    } else {
      navigate("/login");
    }
  }


  return (
    <header className="header">

      <Link
        to="/"
        className="logo"
      >
        SMART QALA
      </Link>


      <nav>

        <div className="language-switch" aria-label="Тілді таңдау / Выбор языка">
          <button
            type="button"
            className={language === "kk" ? "active" : ""}
            onClick={() => setLanguage("kk")}
          >
            ҚАЗ
          </button>

          <span>/</span>

          <button
            type="button"
            className={language === "ru" ? "active" : ""}
            onClick={() => setLanguage("ru")}
          >
            РУС
          </button>
        </div>

        {/* ADMIN HEADER */}

        {user?.role === "admin" ? (
          <>
            <Link to="/admin">
              Кабинет администратора
            </Link>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Выйти
            </button>
          </>
        ) : (
          <>

            {/* NORMAL HEADER */}

            <Link to="/">
              Главная
            </Link>

            <Link to="/ideas">
              Инициативы
            </Link>


            {user?.role === "resident" && (
              <>
                <Link to="/create">
                  Предложить идею
                </Link>

                <Link to="/my-ideas">
                  Мои идеи
                </Link>
              </>
            )}


            {user?.role === "government" && (
              <Link to="/government">
                Кабинет госоргана
              </Link>
            )}


            {!user ? (
              <Link
                to="/login"
                className="nav-login"
              >
                Войти
              </Link>
            ) : (
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                Выйти
              </button>
            )}

          </>
        )}

      </nav>

    </header>
  );
}


export default Header;