# py_crypto/crypto_utils.py
import os
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def derive_key_from_password(password, salt="fixedsalt123"):
    key = hashlib.scrypt(
        password.encode(),
        salt=salt.encode(),
        n=16384, r=8, p=1,
        dklen=32
    )
    return key

def encrypt(text, key):
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    pad_len = 16 - (len(text.encode()) % 16)
    padded = text + chr(pad_len) * pad_len

    encrypted = encryptor.update(padded.encode()) + encryptor.finalize()
    return f"{iv.hex()}:{encrypted.hex()}"

def decrypt(ciphertext, key):
    iv_hex, enc_hex = ciphertext.split(":")
    iv = bytes.fromhex(iv_hex)
    encrypted = bytes.fromhex(enc_hex)

    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    decrypted = decryptor.update(encrypted) + decryptor.finalize()
    pad_len = decrypted[-1]
    return decrypted[:-pad_len].decode()
