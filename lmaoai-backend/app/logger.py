import logging
import os
from logging.handlers import TimedRotatingFileHandler

# Create the logs directory if it doesn't exist
if not os.path.exists("logs"):
    os.makedirs("logs")

# Create a timed rotating file handler
handler = TimedRotatingFileHandler(
    "logs/myapp.log",
    when="D",  # Rotate every day
    interval=2,  # Rotate every 2 days
    backupCount=10,  # Number of log files to keep
)

# Set the log level
handler.setLevel(logging.INFO)

# Create a formatter
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

# Add the formatter to the handler
handler.setFormatter(formatter)

# Add the handler to the logger
logger = logging.getLogger("uvicorn")
logger.addHandler(handler)


if __name__ == "__main__":
    logger.info("This is an info message")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.critical("This is a critical message")
