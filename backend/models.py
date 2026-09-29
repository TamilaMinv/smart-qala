from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    UniqueConstraint,
    DateTime,
    Boolean,
    func,
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    email = Column(
        String(200),
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(
        String(200),
        nullable=False,
    )

    # resident / government / admin
    role = Column(
        String(50),
        nullable=False,
    )

    # Для служебных аккаунтов госорганов.
    # У жителей и администратора эти поля остаются NULL.
    department = Column(
        String(200),
        nullable=True,
    )

    government_category = Column(
        String(100),
        nullable=True,
    )

    # head / employee
    government_position = Column(
        String(50),
        nullable=True,
    )

    manager_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class Idea(Base):
    __tablename__ = "ideas"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    author_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    problem = Column(
        Text,
        nullable=False,
    )

    solution = Column(
        Text,
        nullable=False,
    )

    location = Column(
        String(200),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=False,
        default="Ожидает классификации",
    )

    status = Column(
        String(100),
        nullable=False,
        default="Получена",
    )

    rejection_reason = Column(
        Text,
        nullable=True,
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    supporters = Column(
        Integer,
        nullable=False,
        default=0,
    )

    attachment_name = Column(String(255), nullable=True)
    attachment_type = Column(String(150), nullable=True)
    attachment_data = Column(Text, nullable=True)


class IdeaSupport(Base):
    __tablename__ = "idea_supports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    idea_id = Column(
        Integer,
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=False,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "idea_id",
            "user_id",
            name="uq_idea_support_user",
        ),
    )

class IdeaStatusHistory(Base):
    __tablename__ = "idea_status_history"

    id = Column(Integer, primary_key=True, index=True)
    idea_id = Column(
        Integer,
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(100), nullable=False)
    rejection_reason = Column(Text, nullable=True)
    changed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    idea_id = Column(
        Integer,
        ForeignKey("ideas.id", ondelete="CASCADE"),
        nullable=True,
    )
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
