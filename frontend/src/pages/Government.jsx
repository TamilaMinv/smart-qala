import { useEffect, useState } from "react";

const STATUSES = [
  "Получена",
  "На рассмотрении",
  "В работе",
  "Нужны уточнения",
  "Завершена",
  "Отклонена",
];

function Government() {
  const [ideas, setIdeas] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [filter, setFilter] = useState("Все");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("smartQalaUser");
  const currentUser = storedUser
    ? JSON.parse(storedUser)
    : null;

  const isHead =
    currentUser?.government_position === "head";

  async function loadIdeas() {
    if (!currentUser?.id) {
      setError("Не удалось определить служебный аккаунт.");
      setIsLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `https://smart-qala-api.onrender.com/government/${currentUser.id}/ideas`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Не удалось загрузить инициативы"
        );
      }

      setIdeas(data);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadEmployees() {
    if (!isHead || !currentUser?.id) return;

    try {
      const response = await fetch(
        `https://smart-qala-api.onrender.com/government/${currentUser.id}/employees`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Не удалось загрузить сотрудников"
        );
      }

      setEmployees(data);
    } catch (error) {
      setError(error.message);
    }
  }

  useEffect(() => {
    loadIdeas();
    loadEmployees();
  }, []);

  function openIdea(idea) {
    setSelectedIdea(idea);
    setSelectedStatus(idea.status);
    setRejectionReason(idea.rejection_reason || "");
    setAssignedTo(
      idea.assigned_to ? String(idea.assigned_to) : ""
    );
    setError("");
  }

  function closeIdea() {
    setSelectedIdea(null);
    setSelectedStatus("");
    setRejectionReason("");
    setAssignedTo("");
    setError("");
  }

  async function assignEmployee() {
    if (!selectedIdea || !isHead) return;

    if (!assignedTo) {
      setError("Выберите ответственного сотрудника.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `https://smart-qala-api.onrender.com/ideas/${selectedIdea.id}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            manager_id: currentUser.id,
            employee_id: Number(assignedTo),
          }),
        }
      );

      const updatedIdea = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedIdea.detail ||
            "Не удалось назначить ответственного."
        );
      }

      setIdeas((previous) =>
        previous.map((idea) =>
          idea.id === updatedIdea.id ? updatedIdea : idea
        )
      );
      setSelectedIdea(updatedIdea);
      setSelectedStatus(updatedIdea.status);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveStatus() {
    if (!selectedIdea) return;

    if (
      selectedStatus === "Отклонена" &&
      !rejectionReason.trim()
    ) {
      setError("Укажите причину отклонения.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(
        `https://smart-qala-api.onrender.com/ideas/${selectedIdea.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            rejection_reason:
              selectedStatus === "Отклонена"
                ? rejectionReason.trim()
                : null,
          }),
        }
      );

      const updatedIdea = await response.json();

      if (!response.ok) {
        throw new Error(
          updatedIdea.detail ||
            "Не удалось изменить статус"
        );
      }

      setIdeas((previous) =>
        previous.map((idea) =>
          idea.id === updatedIdea.id ? updatedIdea : idea
        )
      );

      setSelectedIdea(updatedIdea);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  const filteredIdeas =
    filter === "Все"
      ? ideas
      : ideas.filter((idea) => idea.status === filter);

  const assignedEmployee = (idea) =>
    employees.find(
      (employee) => employee.id === idea.assigned_to
    );

  return (
    <div className="government-page">
      <main className="government-container">
        <section className="government-profile">
          <div>
            <p className="label">
              SMART QALA · GOVERNMENT
            </p>
            <h1>
              {currentUser?.department ||
                "Кабинет государственного органа"}
            </h1>
            <div className="government-profile-meta">
              <span>
                Категория:{" "}
                <strong>
                  {currentUser?.government_category ||
                    "не назначена"}
                </strong>
              </span>
              <span>
                Роль:{" "}
                <strong>
                  {isHead
                    ? "Руководитель подразделения"
                    : "Сотрудник подразделения"}
                </strong>
              </span>
              <span>
                Сотрудник:{" "}
                <strong>{currentUser?.name}</strong>
              </span>
            </div>
          </div>

          <div className="government-counter">
            <span>
              {isHead
                ? "Заявок категории"
                : "Назначено мне"}
            </span>
            <strong>{ideas.length}</strong>
          </div>
        </section>

        <div className="government-filters">
          {[
            "Все",
            "Получена",
            "На рассмотрении",
            "В работе",
            "Завершена",
            "Отклонена",
          ].map((status) => (
            <button
              key={status}
              className={
                filter === status
                  ? "government-filter active"
                  : "government-filter"
              }
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {error && (
          <p className="form-error">{error}</p>
        )}

        {isLoading && (
          <p className="government-message">
            Загружаем инициативы...
          </p>
        )}

        {!isLoading && filteredIdeas.length === 0 && (
          <div className="government-empty">
            {currentUser?.government_category
              ? "Здесь пока нет инициатив."
              : "Для этого аккаунта ещё не назначены подразделение и категория."}
          </div>
        )}

        {!isLoading && filteredIdeas.length > 0 && (
          <div className="government-list">
            {filteredIdeas.map((idea) => {
              const employee = assignedEmployee(idea);

              return (
                <article
                  className="government-card"
                  key={idea.id}
                >
                  <div className="government-card-main">
                    <div className="government-card-meta">
                      <span className="category-badge">
                        {idea.category}
                      </span>
                      <span className="government-id">
                        ID #{idea.id}
                      </span>
                    </div>

                    <h2>{idea.title}</h2>
                    <p>{idea.problem}</p>

                    <div className="government-location">
                      📍 {idea.location}
                    </div>

                    {isHead && (
                      <div className="government-assignee">
                        Ответственный:{" "}
                        <strong>
                          {employee
                            ? employee.name
                            : "не назначен"}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="government-card-side">
                    <span
                      className={`government-status status-${idea.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {idea.status}
                    </span>

                    <button
                      className="government-open-button"
                      onClick={() => openIdea(idea)}
                    >
                      Открыть заявку →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectedIdea && (
        <div
          className="idea-modal-overlay"
          onClick={closeIdea}
        >
          <div
            className="idea-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={closeIdea}
            >
              ×
            </button>

            <p className="label">
              ИНИЦИАТИВА #{selectedIdea.id}
            </p>
            <h2>{selectedIdea.title}</h2>

            <div className="modal-section">
              <span className="modal-section-label">
                ПРОБЛЕМА
              </span>
              <p>{selectedIdea.problem}</p>
            </div>

            <div className="modal-section">
              <span className="modal-section-label">
                ПРЕДЛАГАЕМОЕ РЕШЕНИЕ
              </span>
              <p>{selectedIdea.solution}</p>
            </div>

            <div className="modal-info-grid">
              <div>
                <span className="modal-section-label">
                  ТЕРРИТОРИЯ
                </span>
                <p>{selectedIdea.location}</p>
              </div>

              <div>
                <span className="modal-section-label">
                  КАТЕГОРИЯ
                </span>
                <p>{selectedIdea.category}</p>
              </div>
            </div>

            <div className="government-processing">
              <h3>Обработка инициативы</h3>

              {isHead && (
                <div className="form-group">
                  <label htmlFor="responsible">
                    Ответственный сотрудник
                  </label>

                  <select
                    id="responsible"
                    value={assignedTo}
                    onChange={(event) =>
                      setAssignedTo(event.target.value)
                    }
                  >
                    <option value="">
                      Выберите сотрудника
                    </option>
                    {employees.map((employee) => (
                      <option
                        value={employee.id}
                        key={employee.id}
                      >
                        {employee.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="government-assign-button"
                    onClick={assignEmployee}
                    disabled={isSaving || !assignedTo}
                  >
                    Назначить ответственного
                  </button>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="status">
                  Статус
                </label>

                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(event) => {
                    const nextStatus =
                      event.target.value;
                    setSelectedStatus(nextStatus);

                    if (nextStatus !== "Отклонена") {
                      setRejectionReason("");
                    }
                  }}
                >
                  {STATUSES.map((status) => (
                    <option
                      value={status}
                      key={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStatus === "Отклонена" && (
                <div className="form-group">
                  <label htmlFor="rejection-reason">
                    Причина отклонения
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(
                        event.target.value
                      )
                    }
                    placeholder="Укажите причину отклонения"
                    rows="4"
                    required
                  />
                </div>
              )}

              <button
                className="submit-button"
                onClick={saveStatus}
                disabled={isSaving}
              >
                {isSaving
                  ? "Сохраняем..."
                  : "Сохранить статус"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Government;
