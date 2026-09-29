import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import "./App.css";
import smartQalaImage from "./assets/smart_qala.png";

import Header from "./components/Header";

import Ideas from "./pages/Ideas";
import CreateIdea from "./pages/CreateIdea";
import Government from "./pages/Government";
import Login from "./pages/Login";
import MyIdeas from "./pages/MyIdeas";

import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

import ProtectedRoute from "./ProtectedRoute";


function Home() {
  return (
    <div className="app">

      {/* =====================================
          HERO
      ====================================== */}

      <main className="hero">

        <div className="hero-content">

          <p className="label">
            ЦИФРОВЫЕ ИНИЦИАТИВЫ ГОРОДА
          </p>

          <h1>
            От идеи жителя —
            <br />
            к умному городу.
          </h1>

          <p className="description">
            Предлагайте цифровые инициативы,
            которые могут сделать город удобнее,
            безопаснее и технологичнее.
          </p>


          <div className="actions">

            <Link
              to="/create"
              className="primary"
            >
              Предложить идею
            </Link>

            <Link
              to="/ideas"
              className="secondary"
            >
              Смотреть инициативы
            </Link>

          </div>

        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-glow" />
          <img
            src={smartQalaImage}
            alt=""
            className="hero-city-image"
          />
        </div>

      </main>


      {/* =====================================
          HOW IT WORKS
      ====================================== */}

      <section className="how home-process">

        <p className="label">
          КАК ЭТО РАБОТАЕТ
        </p>

        <h2>
          От идеи до результата
        </h2>

        <p className="home-process-description">
          После отправки инициатива проходит
          несколько этапов. Вы можете следить
          за её статусом в личном кабинете.
        </p>


        <div className="home-process-steps">

          {/* STEP 1 */}

          <div className="home-process-step">

            <div className="home-step-top">

              <span className="home-step-number">
                01
              </span>

              <div className="home-step-line" />

            </div>

            <h3>
              Подача
            </h3>

            <p>
              Опишите городскую проблему
              и предложите цифровое решение
              через SMART QALA.
            </p>

          </div>


          {/* STEP 2 */}

          <div className="home-process-step">

            <div className="home-step-top">

              <span className="home-step-number">
                02
              </span>

              <div className="home-step-line" />

            </div>

            <h3>
              Автоматическая обработка
            </h3>

            <p>
              SMART QALA определяет направление
              инициативы и передаёт её
              ответственному органу.
            </p>

          </div>


          {/* STEP 3 */}

          <div className="home-process-step">

            <div className="home-step-top">

              <span className="home-step-number">
                03
              </span>

              <div className="home-step-line" />

            </div>

            <h3>
              Рассмотрение
            </h3>

            <p>
              Сотрудник изучает инициативу,
              меняет её статус и при необходимости
              запрашивает уточнения.
            </p>

          </div>


          {/* STEP 4 */}

          <div className="home-process-step">

            <div className="home-step-top">

              <span className="home-step-number">
                04
              </span>

              <div className="home-step-line" />

            </div>

            <h3>
              Результат
            </h3>

            <p>
              Вы получаете итоговый статус
              и обратную связь по своей
              инициативе.
            </p>

          </div>

        </div>


        {/* DEADLINE */}

        <div className="home-deadline">

          <div className="home-deadline-icon">
            ◷
          </div>


          <div className="home-deadline-content">

            <span className="home-deadline-label">
              СРОК РАССМОТРЕНИЯ
            </span>

            <strong>
              До 30 календарных дней
            </strong>

            <p>
              Статус инициативы и ход её
              рассмотрения доступны в личном кабинете.
            </p>

          </div>


          <Link
            to="/my-ideas"
            className="home-deadline-link"
          >
            Мои инициативы →
          </Link>

        </div>

      </section>

    </div>
  );
}


function AppLayout() {
  return (
    <>
      <Header />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />


        <Route
          path="/login"
          element={<Login />}
        />


        {/* Скрытый административный вход */}

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />


        <Route
          path="/ideas"
          element={<Ideas />}
        />


        <Route
          path="/create"
          element={
            <ProtectedRoute
              allowedRole="resident"
            >
              <CreateIdea />
            </ProtectedRoute>
          }
        />


        <Route
          path="/my-ideas"
          element={
            <ProtectedRoute
              allowedRole="resident"
            >
              <MyIdeas />
            </ProtectedRoute>
          }
        />


        <Route
          path="/government"
          element={
            <ProtectedRoute
              allowedRole="government"
            >
              <Government />
            </ProtectedRoute>
          }
        />


        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRole="admin"
            >
              <Admin />
            </ProtectedRoute>
          }
        />

      </Routes>

    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}


export default App;