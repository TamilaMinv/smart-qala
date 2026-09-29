import { useEffect, useState } from "react";

const CATEGORIES = [
  "Транспорт",
  "ЖКХ",
  "Экология",
  "Безопасность",
  "Образование",
  "Здравоохранение",
  "Городская инфраструктура",
  "Цифровые сервисы",
  "Социальная сфера",
  "Другое",
];

function Admin() {
  const [employees, setEmployees] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [position, setPosition] = useState("head");
  const [managerId, setManagerId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadEmployees() {
    try {
      setError("");

      const response = await fetch(
        "https://smart-qala-api.onrender.com/admin/employees"
      );

      if (!response.ok) {
        throw new Error("Не удалось загрузить сотрудников.");
      }

      setEmployees(await response.json());
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  const heads = employees.filter(
    (employee) => employee.government_position === "head"
  );

  const selectedManager = heads.find(
    (employee) => String(employee.id) === String(managerId)
  );

  function chooseManager(value) {
    setManagerId(value);

    const manager = heads.find(
      (employee) => String(employee.id) === String(value)
    );

    if (manager) {
      setDepartment(manager.department || "");
      setCategory(manager.government_category || CATEGORIES[0]);
    }
  }

  async function handleCreateEmployee(event) {
    event.preventDefault();

    if (position === "employee" && !managerId) {
      setError("Выберите руководителя подразделения.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "https://smart-qala-api.onrender.com/admin/employees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            department,
            government_category: category,
            government_position: position,
            manager_id:
              position === "employee"
                ? Number(managerId)
                : null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Не удалось создать сотрудника."
        );
      }

      setName("");
      setEmail("");
      setPassword("");
      setDepartment("");
      setCategory(CATEGORIES[0]);
      setPosition("head");
      setManagerId("");

      setSuccess(`Аккаунт ${data.name} создан.`);
      await loadEmployees();
    } catch (error) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteEmployee(employee) {
    const confirmed = window.confirm(
      `Удалить аккаунт сотрудника "${employee.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `https://smart-qala-api.onrender.com/admin/employees/${employee.id}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Не удалось удалить сотрудника."
        );
      }

      setSuccess(`Аккаунт ${employee.name} удалён.`);
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
            <p className="label">АДМИНИСТРИРОВАНИЕ</p>
            <h1>Управление системой</h1>
            <p>
              Создавайте подразделения, руководителей и сотрудников
              государственных органов.
            </p>
          </div>

          <div className="admin-stat-card">
            <span>Служебных аккаунтов</span>
            <strong>{employees.length}</strong>
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
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-panel-number">01</p>
                <h2>Добавить служебный аккаунт</h2>
              </div>
            </div>

            <p className="admin-panel-description">
              Руководитель получает все инициативы своей категории.
              Сотрудник получает только назначенные ему заявки.
            </p>

            <form
              className="admin-employee-form"
              onSubmit={handleCreateEmployee}
            >
              <label>
                ФИО
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Например: Иван Иванов"
                  minLength="2"
                  required
                />
              </label>

              <label>
                Роль в подразделении
                <select
                  value={position}
                  onChange={(event) => {
                    setPosition(event.target.value);
                    setManagerId("");
                    if (event.target.value === "head") {
                      setDepartment("");
                      setCategory(CATEGORIES[0]);
                    }
                  }}
                >
                  <option value="head">
                    Руководитель подразделения
                  </option>
                  <option value="employee">
                    Сотрудник подразделения
                  </option>
                </select>
              </label>

              {position === "employee" && (
                <label>
                  Руководитель
                  <select
                    value={managerId}
                    onChange={(event) =>
                      chooseManager(event.target.value)
                    }
                    required
                  >
                    <option value="">
                      Выберите руководителя
                    </option>
                    {heads.map((head) => (
                      <option value={head.id} key={head.id}>
                        {head.name} — {head.department} —{" "}
                        {head.government_category}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Подразделение
                <input
                  type="text"
                  value={department}
                  onChange={(event) =>
                    setDepartment(event.target.value)
                  }
                  placeholder="Например: Отдел транспорта"
                  required
                  disabled={position === "employee"}
                />
              </label>

              <label>
                Категория инициатив
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  disabled={position === "employee"}
                >
                  {CATEGORIES.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              {position === "employee" && selectedManager && (
                <div className="admin-hierarchy-note">
                  Сотрудник будет добавлен в подразделение{" "}
                  <strong>{selectedManager.department}</strong> и будет
                  работать с категорией{" "}
                  <strong>
                    {selectedManager.government_category}
                  </strong>.
                </div>
              )}

              <label>
                Служебный email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                {creating ? "Создание..." : "+ Создать аккаунт"}
              </button>
            </form>
          </section>

          <section className="admin-panel admin-employees-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-panel-number">02</p>
                <h2>Структура госорганов</h2>
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
                      {employee.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="admin-employee-info">
                      <strong>{employee.name}</strong>
                      <span>{employee.email}</span>
                      <small>
                        {employee.government_position === "head"
                          ? "Руководитель"
                          : "Сотрудник"}
                        {employee.department
                          ? ` · ${employee.department}`
                          : ""}
                        {employee.government_category
                          ? ` · ${employee.government_category}`
                          : ""}
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
