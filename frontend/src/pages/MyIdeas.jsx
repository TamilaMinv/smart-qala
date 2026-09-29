import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";


function MyIdeas() {
  const [ideas, setIdeas] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const savedUser = localStorage.getItem(
    "smartQalaUser"
  );

  const user = savedUser
    ? JSON.parse(savedUser)
    : null;


  useEffect(() => {
    if (!user) {
      return;
    }

    fetch(
      `http://127.0.0.1:8000/users/${user.id}/ideas`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Не удалось загрузить ваши инициативы."
          );
        }

        return response.json();
      })

      .then((data) => {
        setIdeas(data);
      })

      .catch((error) => {
        setError(error.message);
      })

      .finally(() => {
        setLoading(false);
      });

  }, [user?.id]);


  return (
    <div className="ideas-page">

      <div className="ideas-container">

        <div className="ideas-heading">

          <div>

            <p className="label">
              ЛИЧНЫЙ КАБИНЕТ
            </p>

            <h1>
              Мои идеи
            </h1>

            <p>
              Здесь отображаются ваши цифровые
              инициативы и текущий статус их
              рассмотрения.
            </p>

          </div>


          <Link
            to="/create"
            className="primary ideas-create-button"
          >
            + Предложить идею
          </Link>

        </div>


        {loading && (
          <div className="government-message">
            Загружаем инициативы...
          </div>
        )}


        {error && (
          <div className="government-message">
            {error}
          </div>
        )}


        {!loading &&
          !error &&
          ideas.length === 0 && (

          <div className="government-empty">

            <h2>
              У вас пока нет инициатив
            </h2>

            <p>
              Предложите цифровое решение
              для города.
            </p>

            <Link
              to="/create"
              className="primary"
            >
              Предложить первую идею
            </Link>

          </div>
        )}


        <div className="ideas-grid">

          {ideas.map((idea) => (

            <article
              className="idea-card"
              key={idea.id}
            >

              <div className="idea-card-top">

                <span className="category-badge">
                  {idea.category}
                </span>

                <span className="status-badge">
                  {idea.status}
                </span>

              </div>


              <h2>
                {idea.title}
              </h2>


              <p className="idea-description">
                {idea.problem}
              </p>


              <div className="idea-location">
                📍 {idea.location}
              </div>


              <div className="idea-card-bottom">

                <div>
                  <strong>
                    {idea.supporters}
                  </strong>

                  <div className="support-label">
                    поддержали
                  </div>
                </div>


                <span className="idea-id">
                  ID #{idea.id}
                </span>

              </div>

            </article>

          ))}

        </div>

      </div>

    </div>
  );
}


export default MyIdeas;