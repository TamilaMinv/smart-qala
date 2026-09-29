import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "https://smart-qala-api.onrender.com";

function MyIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [histories, setHistories] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const savedUser = localStorage.getItem("smartQalaUser");
  const user = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    if (!user) return;

    async function loadCabinet() {
      try {
        setLoading(true);
        setError("");

        const [ideasResponse, notificationsResponse] = await Promise.all([
          fetch(`${API}/users/${user.id}/ideas`),
          fetch(`${API}/users/${user.id}/notifications`),
        ]);

        if (!ideasResponse.ok) {
          throw new Error("Не удалось загрузить ваши инициативы.");
        }

        const ideasData = await ideasResponse.json();
        setIdeas(ideasData);

        if (notificationsResponse.ok) {
          setNotifications(await notificationsResponse.json());
        }

        const historyEntries = await Promise.all(
          ideasData.map(async (idea) => {
            const response = await fetch(`${API}/ideas/${idea.id}/history`);
            const data = response.ok ? await response.json() : [];
            return [idea.id, data];
          })
        );

        setHistories(Object.fromEntries(historyEntries));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCabinet();
  }, [user?.id]);

  function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleString("ru-RU");
  }

  return (
    <div className="ideas-page">
      <div className="ideas-container">
        <div className="ideas-heading">
          <div>
            <p className="label">ЛИЧНЫЙ КАБИНЕТ</p>
            <h1>Мои идеи</h1>
            <p>
              Здесь отображаются ваши инициативы, уведомления
              и история их рассмотрения.
            </p>
          </div>

          <Link to="/create" className="primary ideas-create-button">
            + Предложить идею
          </Link>
        </div>

        {!loading && notifications.length > 0 && (
          <section
            style={{
              marginBottom: "28px",
              padding: "20px",
              border: "1px solid rgba(148,163,184,.25)",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Уведомления</h2>

            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(148,163,184,.15)",
                }}
              >
                <strong>{notification.message}</strong>
                <div style={{ opacity: 0.65, marginTop: "4px" }}>
                  {formatDate(notification.created_at)}
                </div>
              </div>
            ))}
          </section>
        )}

        {loading && (
          <div className="government-message">
            Загружаем инициативы...
          </div>
        )}

        {error && (
          <div className="government-message">{error}</div>
        )}

        {!loading && !error && ideas.length === 0 && (
          <div className="government-empty">
            <h2>У вас пока нет инициатив</h2>
            <p>Предложите цифровое решение для города.</p>
            <Link to="/create" className="primary">
              Предложить первую идею
            </Link>
          </div>
        )}

        <div className="ideas-grid">
          {ideas.map((idea) => (
            <article className="idea-card" key={idea.id}>
              <div className="idea-card-top">
                <span className="category-badge">{idea.category}</span>

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

              <h2>{idea.title}</h2>
              <p className="idea-description">{idea.problem}</p>

              <div className="idea-location">
                📍 {idea.location}
              </div>

              {idea.attachment_name && (
                <div style={{ marginTop: "12px" }}>
                  <a
                    href={`${API}/ideas/${idea.id}/attachment`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 {idea.attachment_name}
                  </a>
                </div>
              )}

              {idea.status === "Отклонена" &&
                idea.rejection_reason && (
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                    }}
                  >
                    <strong>Причина отклонения:</strong>{" "}
                    {idea.rejection_reason}
                  </div>
                )}

              <div
                style={{
                  marginTop: "18px",
                  paddingTop: "14px",
                  borderTop: "1px solid rgba(148,163,184,.18)",
                }}
              >
                <strong>История статусов</strong>

                {(histories[idea.id] || []).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span>
                      ● {item.status}
                      {item.rejection_reason
                        ? ` — ${item.rejection_reason}`
                        : ""}
                    </span>
                    <small style={{ opacity: 0.65 }}>
                      {formatDate(item.created_at)}
                    </small>
                  </div>
                ))}
              </div>

              <div className="idea-card-bottom">
                <div>
                  <strong>{idea.supporters}</strong>
                  <div className="support-label">поддержали</div>
                </div>
                <span className="idea-id">ID #{idea.id}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyIdeas;
