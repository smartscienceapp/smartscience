FROM python:3.10

# 1. Buat user non-root dulu (Standard Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

# 2. Set working directory ke dalam home user agar punya akses penuh
WORKDIR $HOME/app

# 3. Copy requirements & Install dependencies
# Gunakan --chown=user agar file dimiliki oleh user, bukan root
COPY --chown=user ./requirements.txt $HOME/app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# 4. Copy sisa kode aplikasi
COPY --chown=user . $HOME/app

# 5. Jalankan aplikasi
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]