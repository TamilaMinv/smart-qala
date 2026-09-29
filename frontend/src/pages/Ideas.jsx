import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";


function Ideas() {
  const navigate = useNavigate();

  const [ideas, setIdeas] = useState([]);
  const [supportedIdeas, setSupportedIdeas] = useState({});
  const [supportLoading, setSupportLoading] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");


  const savedUser = localStorage.getItem(
    "smartQalaUser"
  );

  const user = savedUser
    ? JSON.parse(savedUser)
    : null;


  useEffect(() => {
    async function loadIdeas() {
      try {
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


        if (user?.role === "resident") {
          const supportStatuses = {};

          await Promise.all(
            data.map(async (idea) => {
              try {
                const supportResponse = await fetch(
                  `https://smart-qala-api.onrender.com/ideas/${idea.id}/support/${user.id}`
                );

                if (supportResponse.ok) {
                  const supportData =
                    await supportResponse.json();

                  supportStatuses[idea.id] =
                    supportData.supported;
                }
              } catch (supportError) {
                console.error(
                  "Ошибка проверки поддержки:",
                  supportError
                );
              }
            })
          );

          setSupportedIdeas(
            supportStatuses
          );
        }

      } catch (error) {
        console.error(error);

        setError(
          "Не удалось загрузить инициативы."
        );

      } finally {
        setIsLoading(false);
      }
    }

    loadIdeas();

  }, [user?.id, user?.role]);


  async function handleSupport(ideaId) {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "resident") {
      return;
    }

    if (supportLoading[ideaId]) {
      return;
    }


    setSupportLoading((current) => ({
      ...current,
      [ideaId]: true,
    }));


    try {
      const response = await fetch(
        `https://smart-qala-api.onrender.com/ideas/${ideaId}/support`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Не удалось поддержать инициативу."
        );
      }


      setIdeas((currentIdeas) =>
        currentIdeas.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                supporters: data.supporters,
              }
            : idea
        )
      );


      setSupportedIdeas((current) => ({
        ...current,
        [ideaId]: data.supported,
      }));


    } catch (error) {
      console.error(error);

      setError(error.message);

    } finally {
      setSupportLoading((current) => ({
        ...current,
        [ideaId]: false,
      }));
    }
  }


  return (
    <div className="ideas-page">

      <main className="ideas-container">

        <div className="ideas-heading">

          <div>
            <p className="label">
              ИДЕИ ЖИТЕЛЕЙ
            </p>

            <h1>
              Инициативы
            </h1>

            <p>
              Посмотрите предложения жителей.
              Возможно, ваша идея уже существует —
              тогда её можно поддержать.
            </p>
          </div>


          {user?.role === "resident" && (
            <Link
              to="/create"
              className="primary ideas-create-button"
            >
              + Предложить идею
            </Link>
          )}

        </div>


        <div className="ideas-tools">

          <input
            type="text"
            placeholder="Поиск инициатив..."
            className="search-input"
          />

          <select
            className="filter-select"
            defaultValue="all"
          >
            <option value="all">
              Все категории
            </option>

            <option value="transport">
              Транспорт
            </option>

            <option value="environment">
              Экология
            </option>

            <option value="city">
              Городская среда
            </option>

            <option value="safety">
              Безопасность
            </option>
          </select>

        </div>


        {isLoading && (
          <p>
            Загружаем инициативы...
          </p>
        )}


        {error && (
          <p className="form-error">
            {error}
          </p>
        )}


        {!isLoading && !error && (

          <div className="ideas-grid">

            {ideas.map((idea) => {

              const isSupported =
                supportedIdeas[idea.id] === true;

              const isSupportLoading =
                supportLoading[idea.id] === true;


              return (
                <article
                  className="idea-card"
                  key={idea.id}
                >

                  <div className="idea-card-top">

                    <span className="category-badge">
                      {idea.category}
                    </span>

                    <span
                      className="status-badge"
                      style={
                        idea.status === "Отклонена"
                          ? {
                              background: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                            }
                          : undefined
                      }
                    >
                      {idea.status}
                    </span>

                  </div>


                  <h2>
                    {idea.title}
                  </h2>


                  <p className="idea-description">
                    {idea.solution}
                  </p>


                  <div className="idea-location">
                    📍 {idea.location}
                  </div>


                  <div className="idea-card-bottom">

                    <div>
                      <strong>
                        {idea.supporters}
                      </strong>

                      <span className="support-label">
                        {" "}поддержали
                      </span>
                    </div>


                    {user?.role === "resident" && (
                      <button
                        type="button"
                        className={
                          isSupported
                            ? "support-button support-button-active"
                            : "support-button"
                        }
                        onClick={() =>
                          handleSupport(idea.id)
                        }
                        disabled={isSupportLoading}
                      >
                        {isSupportLoading
                          ? "..."
                          : isSupported
                          ? "♥ Поддержано"
                          : "♡ Поддержать"}
                      </button>
                    )}


                    {!user && (
                      <button
                        type="button"
                        className="support-button"
                        onClick={() =>
                          handleSupport(idea.id)
                        }
                      >
                        ♡ Поддержать
                      </button>
                    )}

                  </div>

                </article>
              );
            })}

          </div>

        )}

      </main>

    </div>
  );
}


export default Ideas;