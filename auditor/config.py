
import os
from pathlib import Path

class Config:
    """Configuration settings for DevShield Auditor."""
    
    # CORS Settings
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001"
    ]
    
    # Workspace Settings
    # ─── Workspace Paths ─────────────────────────────────────────────────────────

    # Where user workspaces are stored (absolute path)
    # Example: /home/user/DevShield/workspaces or C:\Users\DevShield\workspaces
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # BASE_DIR = devshield/
    WORKSPACES_PATH = os.environ.get(
        "WORKSPACES_PATH",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "workspaces"))
    )

    
    # Database Settings
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "devshield")
    
    # LLM Settings
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")  # 'groq' or 'ollama'
    
    # Groq Settings
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
    
    # Ollama Settings
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "codellama")
    
    # Scanner Settings
    SEMGREP_TIMEOUT = int(os.getenv("SEMGREP_TIMEOUT", "30"))
    
    # Logging Settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def get_workspace_path(cls, project_name):
        """Get the full path to a project's workspace."""
        return os.path.join(cls.WORKSPACES_PATH, project_name)
    
    @classmethod
    def validate_config(cls):
        """Validate configuration settings."""
        issues = []
        
        # Check workspace path
        if not os.path.exists(cls.WORKSPACES_PATH):
            issues.append(f"Workspaces directory not found: {cls.WORKSPACES_PATH}")
        
        # Check LLM provider settings
        if cls.LLM_PROVIDER == "groq" and not cls.GROQ_API_KEY:
            issues.append("GROQ_API_KEY is required when using Groq LLM provider")
        
        return issues

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    # dotenv not installed, skip
    pass

# Print configuration for debugging
if __name__ == "__main__":
    print("DevShield Auditor Configuration:")
    print(f"WORKSPACES_PATH: {Config.WORKSPACES_PATH}")
    print(f"MONGO_URI: {Config.MONGO_URI}")
    print(f"LLM_PROVIDER: {Config.LLM_PROVIDER}")
    
    validation_issues = Config.validate_config()
    if validation_issues:
        print("Configuration Issues:")
        for issue in validation_issues:
            print(f"  - {issue}")
    else:
        print("✅ Configuration is valid")
