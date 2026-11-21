from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.permissions import get_current_user
from app.models.erp_models import User, UserRole
from app.schemas.erp_schemas import Token, LoginRequest, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserOut)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/switch-role", response_model=Token)
async def switch_role(role: UserRole, db: AsyncSession = Depends(get_db)):
    """
    Demo Persona Switcher:
    Instant role switching across all 10 ERP roles:
    ADMIN, DIRECTOR, SALES_EXECUTIVE, SURVEY_TECHNICIAN, WAREHOUSE_MANAGER,
    INSTALLATION_MANAGER, FIELD_TECHNICIAN, FINANCE_EXECUTIVE, SUPPORT_EXECUTIVE, CUSTOMER.
    """
    result = await db.execute(select(User).filter(User.role == role))
    user = result.scalars().first()
    if not user:
        # Fallback to finding any user or creating
        result = await db.execute(select(User))
        user = result.scalars().first()
        
    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
