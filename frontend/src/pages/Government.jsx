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
  const [selectedIdea, setSelectedIdea] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");

  const [filter, setFilter] = useState("Все");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");


  async function loadIdeas() {
    try {
      setError("");

      const response = await fetch(
        "https://smart-qala-api.onrender.com/ideas"
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось загрузить инициативы"
        );
      }

      const data = await response.json();

      setIdeas(data);
    } catch (error) {
      console.error(error);

      setError(
        "Не удалось получить инициативы с сервера."
      );
    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    loadIdeas();
  }, []);


  function openIdea(idea) {
    setSelectedIdea(idea);
    setSelectedStatus(idea.status);
  }


  function closeIdea() {
    setSelectedIdea(null);
    setSelectedStatus("");
  }


  async function saveStatus() {
    if (!selectedIdea) {
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
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Не удалось изменить статус"
        );
      }

      const updatedIdea = await response.json();

      setIdeas((previousIdeas) =>
        previousIdeas.map((idea) =>
          idea.id === updatedIdea.id
            ? updatedIdea
            : idea
        )
      );

      setSelectedIdea(updatedIdea);

    } catch (error) {
      console.error(error);

      setError(
        "Не удалось сохранить новый статус."
      );
    } finally {
      setIsSaving(false);
    }
  }


  const filteredIdeas =
    filter === "Все"
      ? ideas
      : ideas.filter(
          (idea) => idea.status === filter
        );


  return (
    <div className="government-page">

      <main className="government-container">

        <div className="government-heading">

          <div>
            <p className="label">
              SMART QALA · GOVERNMENT
            </p>

            <h1>
              Входящие инициативы
            </h1>

            <p>
              Рассматривайте цифровые инициативы
              жителей и отслеживайте процесс их
              обработки.
            </p>
          </div>

          <div className="government-counter">
            <span>Всего инициатив</span>

            <strong>
              {ideas.length}
            </strong>
          </div>

        </div>


        <div className="government-filters">

          {[
            "Все",
            "Получена",
            "На рассмотрении",
            "В работе",
            "Завершена",
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
          <p className="form-error">
            {error}
          </p>
        )}


        {isLoading && (
          <p className="government-message">
            Загружаем инициативы...
          </p>
        )}


        {!isLoading &&
          filteredIdeas.length === 0 && (

          <div className="government-empty">
            Здесь пока нет инициатив.
          </div>

        )}


        {!isLoading &&
          filteredIdeas.length > 0 && (

          <div className="government-list">

            {filteredIdeas.map((idea) => (

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


                  <h2>
                    {idea.title}
                  </h2>


                  <p>
                    {idea.problem}
                  </p>


                  <div className="government-location">
                    📍 {idea.location}
                  </div>

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

            ))}

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


            <h2>
              {selectedIdea.title}
            </h2>


            <div className="modal-section">

              <span className="modal-section-label">
                ПРОБЛЕМА
              </span>

              <p>
                {selectedIdea.problem}
              </p>

            </div>


            <div className="modal-section">

              <span className="modal-section-label">
                ПРЕДЛАГАЕМОЕ РЕШЕНИЕ
              </span>

              <p>
                {selectedIdea.solution}
              </p>

            </div>


            <div className="modal-info-grid">

              <div>
                <span className="modal-section-label">
                  ТЕРРИТОРИЯ
                </span>

                <p>
                  {selectedIdea.location}
                </p>
              </div>


              <div>
                <span className="modal-section-label">
                  КАТЕГОРИЯ
                </span>

                <p>
                  {selectedIdea.category}
                </p>
              </div>

            </div>


            <div className="government-processing">

              <h3>
                Обработка инициативы
              </h3>


              <div className="form-group">

                <label htmlFor="status">
                  Статус
                </label>

                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value
                    )
                  }
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


              <button
                className="submit-button"
                onClick={saveStatus}
                disabled={isSaving}
              >
                {isSaving
                  ? "Сохраняем..."
                  : "Сохранить изменения"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Government;