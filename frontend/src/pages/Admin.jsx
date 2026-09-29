import { useEffect, useState } from "react";


function Admin() {
  const [employees, setEmployees] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  async function loadEmployees() {
    try {
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/admin/employees"
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось загрузить сотрудников."
        );
      }

      const data = await response.json();

      setEmployees(data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadEmployees();
  }, []);


  // =====================================================
  // CREATE EMPLOYEE
  // =====================================================

  async function handleCreateEmployee(event) {
    event.preventDefault();

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/admin/employees",
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
          "Не удалось создать сотрудника."
        );
      }

      setName("");
      setEmail("");
      setPassword("");

      setSuccess(
        `Аккаунт сотрудника ${data.name} создан.`
      );

      await loadEmployees();

    } catch (error) {
      setError(error.message);

    } finally {
      setCreating(false);
    }
  }


  // =====================================================
  // DELETE EMPLOYEE
  // =====================================================

  async function handleDeleteEmployee(employee) {
    const confirmed = window.confirm(
      `Удалить аккаунт сотрудника "${employee.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/admin/employees/${employee.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Не удалось удалить сотрудника."
        );
      }

      setSuccess(
        `Аккаунт ${employee.name} удалён.`
      );

      await loadEmployees();

    } catch (error) {
      setError(error.message);
    }
  }


  return (
    <div className="admin-page">

      <main className="admin-container">

        <section className="admin-page-heading">

          <div>
            <p className="label">
              АДМИНИСТРИРОВАНИЕ
            </p>

            <h1>
              Управление системой
            </h1>

            <p>
              Создание и управление служебными
              аккаунтами сотрудников государственных
              органов.
            </p>
          </div>


          <div className="admin-stat-card">
            <span>
              Сотрудников
            </span>

            <strong>
              {employees.length}
            </strong>
          </div>

        </section>


        {error && (
          <div className="admin-message admin-message-error">
            {error}
          </div>
        )}


        {success && (
          <div className="admin-message admin-message-success">
            {success}
          </div>
        )}


        <div className="admin-layout">

          {/* CREATE EMPLOYEE */}

          <section className="admin-panel">

            <div className="admin-panel-heading">

              <div>
                <p className="admin-panel-number">
                  01
                </p>

                <h2>
                  Добавить сотрудника
                </h2>
              </div>

            </div>


            <p className="admin-panel-description">
              Создайте служебную учётную запись.
              Самостоятельная регистрация сотрудников
              недоступна.
            </p>


            <form
              className="admin-employee-form"
              onSubmit={handleCreateEmployee}
            >

              <label>
                ФИО сотрудника

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Например: Иван Иванов"
                  minLength="2"
                  required
                />
              </label>


              <label>
                Служебный email

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="employee@smartqala.kz"
                  required
                />
              </label>


              <label>
                Временный пароль

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


              <button
                type="submit"
                className="admin-create-button"
                disabled={creating}
              >
                {creating
                  ? "Создание..."
                  : "+ Создать сотрудника"}
              </button>

            </form>

          </section>


          {/* EMPLOYEE LIST */}

          <section className="admin-panel admin-employees-panel">

            <div className="admin-panel-heading">

              <div>
                <p className="admin-panel-number">
                  02
                </p>

                <h2>
                  Сотрудники госорганов
                </h2>
              </div>

            </div>


            {loading ? (

              <p className="admin-empty">
                Загружаем сотрудников...
              </p>

            ) : employees.length === 0 ? (

              <div className="admin-empty">
                Сотрудники пока не добавлены.
              </div>

            ) : (

              <div className="admin-employees-list">

                {employees.map((employee) => (

                  <div
                    className="admin-employee"
                    key={employee.id}
                  >

                    <div className="admin-employee-avatar">
                      {employee.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>


                    <div className="admin-employee-info">

                      <strong>
                        {employee.name}
                      </strong>

                      <span>
                        {employee.email}
                      </span>

                      <small>
                        Сотрудник госоргана
                      </small>

                    </div>


                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDeleteEmployee(employee)
                      }
                    >
                      Удалить
                    </button>

                  </div>

                ))}

              </div>

            )}

          </section>

        </div>

      </main>

    </div>
  );
}


export default Admin;