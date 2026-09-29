import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageContext.jsx";
import {
  Link,
  useNavigate,
} from "react-router-dom";


function CreateIdea() {

  const navigate = useNavigate();
  const { language } = useLanguage();

  const savedUser = localStorage.getItem(
    "smartQalaUser"
  );

  const user = savedUser
    ? JSON.parse(savedUser)
    : null;


  // =====================================================
  // FORM
  // =====================================================

  const [formData, setFormData] = useState({
    title: "",
    problem: "",
    solution: "",
    location: "Семей",
  });


  // =====================================================
  // AI ASSISTANT
  // =====================================================

  const initialMessage = {
    role: "assistant",
    text:
      language === "kk"
        ? "Сәлеметсіз бе! Мен бастамаңызды рәсімдеуге көмектесемін. Қалада сізді не алаңдатады немесе нені жақсартқыңыз келеді? Өз сөзіңізбен жаза беріңіз, дайын шешім ұсыну міндетті емес."
        : "Здравствуйте! Я помогу оформить инициативу. Расскажите своими словами, что в городе вас беспокоит или что вы хотели бы улучшить. Не обязательно сразу предлагать готовое решение.",
  };

  const [messages, setMessages] =
    useState([initialMessage]);

  const [chatInput, setChatInput] =
    useState("");

  const [aiResult, setAiResult] =
    useState(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiError, setAiError] =
    useState("");


  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text:
          language === "kk"
            ? "Сәлеметсіз бе! Мен бастамаңызды рәсімдеуге көмектесемін. Қалада сізді не алаңдатады немесе нені жақсартқыңыз келеді? Өз сөзіңізбен жаза беріңіз, дайын шешім ұсыну міндетті емес."
            : "Здравствуйте! Я помогу оформить инициативу. Расскажите своими словами, что в городе вас беспокоит или что вы хотели бы улучшить. Не обязательно сразу предлагать готовое решение.",
      },
    ]);
    setChatInput("");
    setAiResult(null);
    setAiError("");
  }, [language]);


  // =====================================================
  // FORM STATE
  // =====================================================

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // FORM CHANGE
  // =====================================================

  function handleChange(event) {

    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // =====================================================
  // AI — PREPARE IDEA
  // =====================================================

  async function handleChatSubmit(event) {

    event.preventDefault();

    const text = chatInput.trim();

    if (!text || aiLoading) {
      return;
    }

    const userMessage = {
      role: "user",
      text,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setChatInput("");
    setAiError("");
    setAiLoading(true);

    try {

      const response = await fetch(
        "https://smart-qala-api.onrender.com/ai/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            messages: updatedMessages,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "AI-помощник временно недоступен."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.message,
        },
      ]);

      if (data.finished) {

        setAiResult({
          title: data.title || "",
          problem: data.problem || "",
          solution: data.solution || "",
          location: data.location || "",
        });
      }

    } catch (error) {

      setAiError(
        error.message ||
        "Не удалось получить ответ AI."
      );

    } finally {

      setAiLoading(false);
    }
  }


  // =====================================================
  // USE AI RESULT
  // =====================================================

  function useAIResult() {

    if (!aiResult) {
      return;
    }

    setFormData({
      title: aiResult.title || "",
      problem: aiResult.problem || "",
      solution: aiResult.solution || "",
      location:
        aiResult.location || "Семей",
    });


    setTimeout(() => {

      document
        .querySelector(".idea-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

    }, 100);
  }


  // =====================================================
  // RESTART AI
  // =====================================================

  function restartAI() {

    setMessages([
      initialMessage,
    ]);

    setChatInput("");
    setAiResult(null);
    setAiError("");
  }


  // =====================================================
  // SUBMIT IDEA
  // =====================================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        "https://smart-qala-api.onrender.com/ideas",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title: formData.title,
            problem: formData.problem,
            solution: formData.solution,
            location: formData.location,
            author_id: user.id,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Не удалось создать инициативу."
        );
      }


      navigate("/my-ideas");


    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="create-page">

      <div className="create-container">


        <Link
          to="/ideas"
          className="back"
        >
          {language === "kk" ? "← Бастамаларға оралу" : "← Вернуться к инициативам"}
        </Link>


        <p className="label">
          {language === "kk" ? "ЖАҢА БАСТАМА" : "НОВАЯ ИНИЦИАТИВА"}
        </p>


        <h1 className="create-title">
          {language === "kk" ? "Идея ұсыну" : "Предложить идею"}
        </h1>


        <p className="create-description">
          {language === "kk"
          ? "Бастаманы қалай дұрыс рәсімдеу керегін білмейсіз бе? Идеяңызды AI-көмекшіге айтып беріңіз немесе нысанды өзіңіз толтырыңыз."
          : "Не знаете, как правильно оформить инициативу? Расскажите о своей идее AI-помощнику или заполните форму самостоятельно."}
        </p>


        {/* =================================================
            REAL AI CHAT
        ================================================= */}


        <section className="idea-assistant">


          <div className="assistant-heading">

            <div className="assistant-icon">
              ✦
            </div>

            <div>

              <p className="assistant-label">
                {language === "kk" ? "SMART QALA AI-КӨМЕКШІСІ" : "AI-ПОМОЩНИК SMART QALA"}
              </p>

              <h2>
                {language === "kk"
                  ? "Идеяңызды бірге рәсімдейік"
                  : "Давайте оформим вашу идею"}
              </h2>

            </div>

          </div>


          <p className="assistant-description">
            {language === "kk"
              ? "Өз сөзіңізбен жауап бере беріңіз. Көмекші толыққанды өтінім дайындау үшін қандай ақпарат жетіспейтінін өзі анықтайды."
              : "Просто отвечайте своими словами. Помощник сам поймёт, какой информации не хватает для полноценной заявки."}
          </p>


          <div className="assistant-chat">

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={
                    message.role === "user"
                      ? "chat-row chat-row-user"
                      : "chat-row chat-row-assistant"
                  }
                >

                  <div
                    className={
                      message.role === "user"
                        ? "chat-message chat-message-user"
                        : "chat-message chat-message-assistant"
                    }
                  >
                    {message.text}
                  </div>

                </div>

              )
            )}


            {aiLoading && (

              <div className="chat-row chat-row-assistant">

                <div className="chat-message chat-message-assistant ai-thinking">
                  <span className="ai-thinking-star">✦</span>
                  {language === "kk" ? "Ойланып жатырмын..." : "Думаю..."}
                </div>

              </div>

            )}

          </div>


          {aiError && (

            <p className="form-error">
              {aiError}
            </p>

          )}


          {!aiResult && (

            <form
              className="assistant-chat-form"
              onSubmit={handleChatSubmit}
            >

              <input
                type="text"
                value={chatInput}
                onChange={(event) =>
                  setChatInput(
                    event.target.value
                  )
                }
                placeholder={language === "kk" ? "Өз сөзіңізбен жазыңыз..." : "Напишите своими словами..."}
                disabled={aiLoading}
              />

              <button
                type="submit"
                disabled={
                  aiLoading ||
                  !chatInput.trim()
                }
              >
                {aiLoading
                  ? "..."
                  : language === "kk"
                    ? "Жіберу →"
                    : "Отправить →"}
              </button>

            </form>

          )}


          {aiResult && (

            <div className="assistant-result">


              <div className="ai-result-header">

                <div>

                  <p className="assistant-result-label">
                    {language === "kk" ? "✦ AI ӨТІНІМДІ ДАЙЫНДАДЫ" : "✦ AI ПОДГОТОВИЛ ЗАЯВКУ"}
                  </p>

                  <h3>
                    {aiResult.title}
                  </h3>

                </div>

              </div>


              <div className="assistant-result-item">
                <span>{language === "kk" ? "Атауы" : "Название"}</span>
                <p>{aiResult.title}</p>
              </div>


              <div className="assistant-result-item">
                <span>{language === "kk" ? "Мәселе" : "Проблема"}</span>
                <p>{aiResult.problem}</p>
              </div>


              <div className="assistant-result-item">
                <span>{language === "kk" ? "Шешім" : "Решение"}</span>
                <p>{aiResult.solution}</p>
              </div>


              <div className="assistant-result-item">
                <span>{language === "kk" ? "Аумақ" : "Территория"}</span>
                <p>{aiResult.location}</p>
              </div>


              <p className="ai-result-hint">
                Перед отправкой вы сможете изменить
                любой текст в форме ниже.
              </p>


              <div className="assistant-result-actions">

                <button
                  type="button"
                  className="assistant-use-button"
                  onClick={useAIResult}
                >
                  {language === "kk" ? "✦ Өтінімде пайдалану" : "✦ Использовать в заявке"}
                </button>

                <button
                  type="button"
                  className="assistant-restart-button"
                  onClick={restartAI}
                >
                  {language === "kk" ? "Қайта бастау" : "Начать заново"}
                </button>

              </div>

            </div>

          )}


        </section>


        <div className="create-divider">

          <span>
            {language === "kk" ? "немесе өзіңіз толтырыңыз" : "или заполните самостоятельно"}
          </span>

        </div>


        {/* =================================================
            FORM
        ================================================= */}


        <form
          className="idea-form"
          onSubmit={handleSubmit}
        >


          <div className="form-group">

            <label htmlFor="title">
              {language === "kk" ? "Бастама атауы" : "Название инициативы"}
            </label>

            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Например: Умные остановки"
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="problem">
              {language === "kk" ? "Қандай мәселені шешкіңіз келеді?" : "Какую проблему вы хотите решить?"}
            </label>

            <textarea
              id="problem"
              name="problem"
              value={formData.problem}
              onChange={handleChange}
              placeholder="Опишите существующую проблему..."
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="solution">
              {language === "kk" ? "Сіздің шешіміңіз" : "Ваше решение"}
            </label>

            <textarea
              id="solution"
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              placeholder="Опишите предлагаемое цифровое решение..."
              required
            />

          </div>


          <div className="form-group">

            <label htmlFor="location">
              {language === "kk" ? "Қала / аумақ" : "Город / территория"}
            </label>

            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />

          </div>


          {error && (

            <p className="form-error">
              {error}
            </p>

          )}


          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >

            {loading
              ? "AI классифицирует и отправляет..."
              : "Отправить инициативу"}

          </button>


        </form>


      </div>

    </div>

  );
}


export default CreateIdea;