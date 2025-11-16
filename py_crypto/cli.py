# py_crypto/cli.py
import sys
from crypto_utils import derive_key_from_password, encrypt, decrypt

"""
Usage:
  python3 cli.py derive <password>
  python3 cli.py encrypt <password> <plaintext>
  python3 cli.py decrypt <password> <ciphertext>
"""

cmd = sys.argv[1]

if cmd == "derive":
    pw = sys.argv[2]
    key = derive_key_from_password(pw)
    print(key.hex())
elif cmd == "encrypt":
    pw = sys.argv[2]
    plain = sys.argv[3]
    key = derive_key_from_password(pw)
    print(encrypt(plain, key))
elif cmd == "decrypt":
    pw = sys.argv[2]
    cipher = sys.argv[3]
    key = derive_key_from_password(pw)
    print(decrypt(cipher, key))
