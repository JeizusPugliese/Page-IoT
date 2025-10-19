from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import psycopg2
from contextlib import contextmanager
from datetime import datetime, timedelta
import jwt as pyjwt

app = Flask(__name__, static_url_path='/static')
CORS(app, 
     resources={r"/*": {"origins": "*"}}, 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = '12345666'
port = int(os.environ.get('PORT', 5000))

# 🔑 conexión a PostgreSQL en Azure
def get_connection():
    return psycopg2.connect(
        user="JesusPugliese13",  
        password="Greentech1302",    
        host="greentech.postgres.database.azure.com",
        port=5432,
        database="softcul"           
    )


revoked_tokens = set()


@contextmanager
def db_cursor():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def extract_token(authorization_header):
    if not authorization_header:
        return None
    value = authorization_header.strip()
    if value.lower().startswith('bearer '):
        return value[7:].strip()
    return value


def decode_token(authorization_header):
    token = extract_token(authorization_header)
    if not token:
        return None, None
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if token in revoked_tokens:
            return None, None
        return token, payload
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        return None, None

@app.route('/')
def home():
    return jsonify({"message": "Bienvenido a la API con PostgreSQL!"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    correo = (data.get('correo') or '').strip()
    password = data.get('password')

    if not correo or not password:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT id, nombre, password, id_rol FROM usuarios WHERE correo = %s", (correo,))
            user = cursor.fetchone()

            if not user:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

            user_id, nombre, password_db, id_rol = user
            if password_db != password:
                return jsonify({"success": False, "message": "Contraseña incorrecta"}), 401

            cursor.execute("SELECT nombre FROM rol WHERE id = %s", (id_rol,))
            rol_row = cursor.fetchone()

        rol = (rol_row[0] if rol_row else 'usuario').lower()
        token = pyjwt.encode({
            'id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, SECRET_KEY, algorithm='HS256')

        return jsonify({
            "success": True,
            "token": token,
            "rol": rol,
            "id": user_id,
            "nombre": nombre
        }), 200
    except Exception as exc:
        logger.exception("Error durante el inicio de sesión")
        return jsonify({"success": False, "message": "Error en la consulta a la base de datos"}), 500

@app.route('/logout', methods=['POST'])
def logout():
    token, payload = decode_token(request.headers.get('Authorization'))
    if not token:
        return jsonify({'error': 'Unauthorized'}), 401

    revoked_tokens.add(token)
    logger.info('Sesión cerrada para el usuario %s', payload.get('id') if payload else 'desconocido')
    return jsonify({'message': 'Sesión cerrada con éxito'}), 200

@app.route('/verificar_token', methods=['POST'])
def verificar_token_route():
    token, _ = decode_token(request.headers.get('Authorization'))
    if not token:
        return jsonify({'success': False, 'message': 'Token inválido o expirado'}), 401
    return jsonify({'success': True, 'message': 'Token válido'}), 200

@app.route('/crear_usuario', methods=['POST'])
def crear_usuario():
    data = request.json or {}
    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    correo = (data.get('correo') or '').strip()
    password = data.get('password')
    celular = (data.get('celular') or '').strip()
    rol = data.get('rol')

    if not all([nombre, apellido, correo, password, celular, rol]):
        return jsonify({'error': 'Faltan datos para crear el usuario'}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT 1 FROM usuarios WHERE correo = %s", (correo,))
            if cursor.fetchone():
                return jsonify({'error': 'El correo ya está registrado'}), 409

            cursor.execute(
                "INSERT INTO usuarios (nombre, apellido, correo, password, celular, id_rol) VALUES (%s, %s, %s, %s, %s, %s)",
                (nombre, apellido, correo, password, celular, int(rol))
            )
        return jsonify({'message': 'Usuario creado exitosamente'}), 201
    except Exception as exc:
        logger.exception('Error al crear usuario')
        return jsonify({'error': 'No se pudo crear el usuario'}), 500

@app.route('/obtener_usuarios', methods=['GET'])
def obtener_usuarios():
    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT id, nombre, apellido, correo, celular, id_rol FROM usuarios")
            usuarios = cursor.fetchall()

        usuarios_list = [{
            "id": row[0],
            "nombre": row[1],
            "apellido": row[2],
            "correo": row[3],
            "celular": row[4],
            "rol": row[5]
        } for row in usuarios]

        return jsonify({
            "success": True,
            "usuarios": usuarios_list,
            "count": len(usuarios_list)
        })
    except Exception as exc:
        logger.exception('Error al obtener usuarios')
        return jsonify({
            "success": False,
            "message": 'Error al obtener usuarios'
        }), 500

@app.route('/obtener_usuario/<correo>', methods=['GET'])
def obtener_usuario(correo):
    try:
        with db_cursor() as cursor:
            cursor.execute(
                "SELECT nombre, apellido, correo, password, celular FROM usuarios WHERE correo = %s",
                (correo,)
            )
            usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        return jsonify({
            "success": True,
            "usuario": {
                "nombre": usuario[0],
                "apellido": usuario[1],
                "correo": usuario[2],
                "password": usuario[3],
                "celular": usuario[4]
            }
        })
    except Exception as exc:
        logger.exception('Error al consultar usuario')
        return jsonify({"success": False, "message": "Error al consultar el usuario"}), 500

@app.route('/actualizar_usuario', methods=['PUT'])
def actualizar_usuario():
    data = request.json or {}
    nombre = (data.get('nombre') or '').strip()
    apellido = (data.get('apellido') or '').strip()
    correo = (data.get('correo') or '').strip()
    celular = (data.get('celular') or '').strip()
    password = (data.get('password') or '').strip()

    if not all([nombre, apellido, correo, celular]):
        return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400

    try:
        with db_cursor() as cursor:
            updates = ["nombre = %s", "apellido = %s", "celular = %s"]
            values = [nombre, apellido, celular]

            if password:
                updates.append("password = %s")
                values.append(password)

            values.append(correo)
            cursor.execute(
                f"UPDATE usuarios SET {', '.join(updates)} WHERE correo = %s",
                tuple(values)
            )

            if cursor.rowcount == 0:
                return jsonify({"success": False, "message": "No se encontró el usuario"}), 404

        return jsonify({"success": True, "message": "Usuario actualizado"})
    except Exception as exc:
        logger.exception('Error al actualizar usuario')
        return jsonify({"success": False, "message": "Error al actualizar el usuario"}), 500

@app.route('/eliminar_usuario/<correo>', methods=['DELETE'])
def eliminar_usuario(correo):
    try:
        with db_cursor() as cursor:
            cursor.execute("DELETE FROM usuarios WHERE correo = %s", (correo,))
            if cursor.rowcount == 0:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
        return jsonify({"success": True, "message": "Usuario eliminado"}), 200
    except Exception as exc:
        logger.exception('Error al eliminar usuario')
        return jsonify({"success": False, "message": "Error al eliminar el usuario"}), 500

@app.route('/tipo_sensor', methods=['GET'])
def get_tipo_sensores():
    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT id, nombre FROM tipo_sensor ORDER BY id")
            tipos = cursor.fetchall()
        tipo_sensor_list = [{"id": t[0], "nombre": t[1]} for t in tipos]
        return jsonify({"success": True, "data": tipo_sensor_list}), 200
    except Exception as exc:
        logger.exception('Error al obtener tipos de sensor')
        return jsonify({"success": False, "message": "Error al obtener tipos de sensores"}), 500

@app.route('/ultimo_valor/<int:sensor_id>', methods=['GET'])
def ultimo_valor(sensor_id):
    try:
        with db_cursor() as cursor:
            cursor.execute(
                "SELECT valor_de_la_medida FROM medidas WHERE id_sensor = %s ORDER BY fecha DESC LIMIT 1",
                (sensor_id,)
            )
            resultado = cursor.fetchone()
        if resultado:
            return jsonify({'valor': resultado[0]})
        return jsonify({'valor': 'No hay datos disponibles'}), 404
    except Exception as exc:
        logger.exception('Error al obtener último valor del sensor %s', sensor_id)
        return jsonify({'valor': 'No se pudo obtener el dato'}), 500

@app.route('/add_sensor', methods=['POST'])
def add_sensor():
    data = request.json
    nombre_sensor = data.get('nombre_sensor')
    referencia = data.get('referencia')
    id_tipo_sensor = data.get('id_tipo_sensor')
    id_usuario = data.get('id_usuario')

    if not nombre_sensor or not referencia or not id_tipo_sensor or not id_usuario:
        return jsonify({"message": "Faltan datos"}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO sensores (nombre_sensor, referencia, id_tipo_sensor, id_usuario) VALUES (%s, %s, %s, %s)",
                (nombre_sensor.strip(), referencia.strip(), int(id_tipo_sensor), int(id_usuario))
            )
        return jsonify({"message": "Sensor añadido con éxito!"}), 201
    except Exception as exc:
        logger.exception('Error al añadir sensor')
        return jsonify({"message": "Error al añadir sensor"}), 500

@app.route('/consultar_reportes', methods=['POST'])
def consultar_reportes():
    data = request.get_json() or {}
    fecha_inicio = data.get('fechaInicio')
    fecha_fin = data.get('fechaFin')
    nombre_sensor = (data.get('nombreSensor') or '').strip()

    if not fecha_inicio or not fecha_fin or not nombre_sensor:
        return jsonify({'error': 'Faltan datos para generar el reporte'}), 400

    try:
        fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
    except ValueError:
        return jsonify({'error': 'Formato de fecha inválido'}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute(
                '''
                SELECT s.nombre_sensor, m.fecha, m.valor_de_la_medida
                FROM medidas m
                JOIN sensores s ON m.id_sensor = s.id
                WHERE s.nombre_sensor = %s
                  AND m.fecha BETWEEN %s AND %s
                ORDER BY m.fecha ASC
                ''',
                (nombre_sensor, fecha_inicio_dt, fecha_fin_dt)
            )
            resultados = cursor.fetchall()

        registros = [{
            'nombreSensor': row[0],
            'fecha': row[1].strftime('%Y-%m-%d %H:%M:%S'),
            'valor': row[2]
        } for row in resultados]

        return jsonify(registros), 200
    except Exception as exc:
        logger.exception('Error al consultar reportes')
        return jsonify({'error': 'No se pudieron obtener los datos'}), 500

@app.route('/sensores_todos', methods=['GET'])
def obtener_todos_los_sensores():
    try:
        with db_cursor() as cursor:
            cursor.execute(
                """
                SELECT s.nombre_sensor, m.fecha, m.valor_de_la_medida
                FROM medidas m
                JOIN sensores s ON m.id_sensor = s.id
                ORDER BY m.fecha DESC
                """
            )
            resultados = cursor.fetchall()

        data = [{
            'sensor': row[0],
            'fecha': row[1].strftime('%Y-%m-%d %H:%M:%S'),
            'valor': row[2]
        } for row in resultados]

        return jsonify(data), 200
    except Exception as exc:
        logger.exception('Error al obtener registros de sensores')
        return jsonify({'error': 'No se pudieron listar los sensores'}), 500

@app.route('/historial')
def mostrar_historial():
    sensor_id = request.args.get('sensor')
    if not sensor_id:
        return jsonify({'error': 'Debe indicar un sensor'}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute(
                "SELECT valor_de_la_medida, fecha FROM medidas WHERE id_sensor = %s ORDER BY fecha DESC",
                (sensor_id,)
            )
            historial = cursor.fetchall()
        historial_json = [{'valor': row[0], 'fecha': row[1].strftime('%Y-%m-%d %H:%M:%S')} for row in historial]
        return jsonify(historial_json)
    except Exception as exc:
        logger.exception('Error al obtener historial del sensor %s', sensor_id)
        return jsonify({'error': 'No se pudo obtener el historial'}), 500

@app.route('/add_card', methods=['POST'])
def add_card():
    user_id = request.json.get('user_id')
    card_name = request.json.get('card_name')
    iframe_url = request.json.get('iframe_url')

    try:
        with db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO tarjetas (nombre, iframe_url, id_usuario) VALUES (%s, %s, %s)",
                (card_name, iframe_url, user_id)
            )
        return jsonify({'message': 'Tarjeta añadida con éxito!'}), 201
    except Exception as exc:
        logger.exception('Error al añadir tarjeta personalizada')
        return jsonify({'message': 'Error al añadir tarjeta'}), 500

@app.route('/get_tarjetas/<int:user_id>', methods=['GET'])
def get_tarjetas(user_id):
    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT nombre, iframe_url FROM tarjetas WHERE id_usuario = %s", (user_id,))
            tarjetas = cursor.fetchall()
        return jsonify(tarjetas), 200
    except Exception as exc:
        logger.exception('Error al obtener tarjetas personalizadas del usuario %s', user_id)
        return jsonify({"message": "Error en la consulta a la base de datos"}), 500

@app.route('/insertar_medidas', methods=['POST'])
def insertar_medidas():
    data = request.json 
    nombre_sensor = data.get('nombre_sensor') 
    nombre_usuario = data.get('nombre_usuario') 
    valor_de_la_medida = data.get('valor_de_la_medida')

    if nombre_sensor is None or nombre_usuario is None or valor_de_la_medida is None:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT id FROM sensores WHERE nombre_sensor = %s", (nombre_sensor,))
            sensor = cursor.fetchone()
            if not sensor:
                return jsonify({"success": False, "message": "Sensor no encontrado"}), 404

            cursor.execute("SELECT id FROM usuarios WHERE nombre = %s", (nombre_usuario,))
            usuario = cursor.fetchone()
            if not usuario:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

            cursor.execute(
                "INSERT INTO medidas (id_sensor, id_usuarios, valor_de_la_medida) VALUES (%s, %s, %s)",
                (sensor[0], usuario[0], valor_de_la_medida)
            )

        return jsonify({"success": True, "message": "Medida añadida con éxito"}), 201
    except Exception as exc:
        logger.exception('Error al insertar medida')
        return jsonify({"success": False, "message": "Error al añadir medida"}), 500

@app.route('/sensores_usuario/<int:id_usuario>', methods=['GET'])
def sensores_usuario(id_usuario):
    try:
        with db_cursor() as cursor:
            cursor.execute(
                '''
                SELECT s.id, s.nombre_sensor, s.referencia, s.id_tipo_sensor, ts.nombre AS tipo_sensor
                FROM sensores s
                JOIN tipo_sensor ts ON s.id_tipo_sensor = ts.id
                WHERE s.id_usuario = %s
                ORDER BY s.id DESC
                ''',
                (id_usuario,)
            )
            sensores = cursor.fetchall()

            if not sensores:
                return jsonify([]), 200

            data = []
            for sensor in sensores:
                sensor_id = sensor[0]
                cursor.execute(
                    "SELECT valor_de_la_medida, fecha FROM medidas WHERE id_sensor = %s ORDER BY fecha DESC LIMIT 1",
                    (sensor_id,)
                )
                ultima = cursor.fetchone()

                valor = ultima[0] if ultima else None
                fecha_ultima = ultima[1] if ultima else None
                online = bool(fecha_ultima and (datetime.utcnow() - fecha_ultima).total_seconds() < 600)

                cursor.execute(
                    "SELECT fecha FROM medidas WHERE id_sensor = %s ORDER BY fecha ASC",
                    (sensor_id,)
                )
                fechas = [row[0] for row in cursor.fetchall()]

                tiempo_encendido = 0
                if fechas:
                    for idx in range(1, len(fechas)):
                        diff = (fechas[idx] - fechas[idx - 1]).total_seconds() / 60
                        if diff < 10:
                            tiempo_encendido += diff
                    if online:
                        tiempo_encendido += max(0, (datetime.utcnow() - fechas[-1]).total_seconds() / 60)

                data.append({
                    'id': sensor[0],
                    'nombre_sensor': sensor[1],
                    'referencia': sensor[2],
                    'id_tipo_sensor': sensor[3],
                    'tipo_sensor': sensor[4],
                    'id_usuario': id_usuario,
                    'valor': valor,
                    'ultimo_dato': fecha_ultima.strftime('%Y-%m-%d %H:%M:%S') if fecha_ultima else None,
                    'estado': 'Online' if online else 'Offline',
                    'tiempo_encendido': int(tiempo_encendido)
                })

        return jsonify(data), 200
    except Exception as exc:
        logger.exception('Error al obtener sensores del usuario %s', id_usuario)
        return jsonify({'error': 'No se pudieron obtener los sensores'}), 500

@app.route('/eliminar_sensor/<int:sensor_id>', methods=['DELETE'])
def eliminar_sensor(sensor_id):
    try:
        with db_cursor() as cursor:
            cursor.execute("DELETE FROM sensores WHERE id = %s", (sensor_id,))
            if cursor.rowcount == 0:
                return jsonify({"success": False, "message": "Sensor no encontrado"}), 404
        return jsonify({"success": True, "message": "Sensor eliminado"}), 200
    except Exception as exc:
        logger.exception('Error al eliminar sensor %s', sensor_id)
        return jsonify({"success": False, "message": "Error al eliminar sensor"}), 500

@app.route('/toggle_sensor/<int:sensor_id>', methods=['POST'])
def toggle_sensor(sensor_id):
    logger.info('Solicitud de cambio de estado para el sensor %s', sensor_id)
    return jsonify({"success": True, "message": "Operación recibida", "sensor_id": sensor_id}), 200

@app.route('/calibrar_sensor/<int:sensor_id>', methods=['POST'])
def calibrar_sensor(sensor_id):
    logger.info('Solicitud de calibración para el sensor %s', sensor_id)
    return jsonify({"success": True, "message": "Operación recibida", "sensor_id": sensor_id}), 200

@app.route('/obtener_usuarios_admin', methods=['GET'])
def obtener_usuarios_admin():
    try:
        with db_cursor() as cursor:
            cursor.execute(
                """
                SELECT u.id, u.nombre, u.apellido, u.correo, u.celular, r.nombre AS rol
                FROM usuarios u
                LEFT JOIN rol r ON u.id_rol = r.id
                ORDER BY u.nombre ASC, u.apellido ASC
                """
            )
            usuarios = cursor.fetchall()

        usuarios_list = [{
            "id": usuario[0],
            "nombre": usuario[1],
            "apellido": usuario[2],
            "correo": usuario[3],
            "celular": usuario[4],
            "rol": usuario[5]
        } for usuario in usuarios]

        return jsonify({
            "success": True,
            "usuarios": usuarios_list,
            "count": len(usuarios_list)
        })
    except Exception as exc:
        logger.exception('Error al obtener usuarios para administración')
        return jsonify({
            "success": False,
            "message": "Error al obtener usuarios"
        }), 500
    

@app.route('/reporte_usuario', methods=['POST'])
def reporte_usuario():
    data = request.get_json() or {}
    id_usuario = data.get('id_usuario')
    fecha_inicio = data.get('fechaInicio')
    fecha_fin = data.get('fechaFin')
    sensor_id = data.get('sensor_id')
    tipo_reporte = (data.get('tipo_reporte') or 'todos').lower()

    if not id_usuario:
        return jsonify({'success': False, 'message': 'Falta id_usuario', 'data': []}), 400

    allowed_reports = {'semanal', 'mensual', 'todos'}
    if tipo_reporte not in allowed_reports:
        tipo_reporte = 'todos'

    fecha_inicio_dt = fecha_fin_dt = None
    try:
        if fecha_inicio:
            fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        if fecha_fin:
            fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)
    except ValueError:
        return jsonify({'success': False, 'message': 'Formato de fecha inválido', 'data': []}), 400

    try:
        with db_cursor() as cursor:
            cursor.execute("SELECT id, nombre_sensor FROM sensores WHERE id_usuario = %s", (id_usuario,))
            sensores = cursor.fetchall()

            if not sensores:
                return jsonify({'success': True, 'data': []}), 200

            sensor_ids = [row[0] for row in sensores]
            sensores_dict = {row[0]: row[1] for row in sensores}

            if sensor_id and int(sensor_id) not in sensor_ids:
                return jsonify({'success': False, 'message': 'El sensor no pertenece al usuario', 'data': []}), 400

            filtros = ["s.id_usuario = %s"]
            params = [id_usuario]

            if sensor_id:
                filtros.append("m.id_sensor = %s")
                params.append(int(sensor_id))

            if fecha_inicio_dt:
                filtros.append("m.fecha >= %s")
                params.append(fecha_inicio_dt)
            if fecha_fin_dt:
                filtros.append("m.fecha <= %s")
                params.append(fecha_fin_dt)

            where_clause = ' AND '.join(filtros)

            if tipo_reporte == 'mensual':
                cursor.execute(
                    f'''
                        SELECT m.id_sensor, s.nombre_sensor, date_trunc('month', m.fecha) AS periodo,
                               AVG(m.valor_de_la_medida) AS promedio, COUNT(*) AS medidas
                        FROM medidas m
                        JOIN sensores s ON m.id_sensor = s.id
                        WHERE {where_clause}
                        GROUP BY m.id_sensor, s.nombre_sensor, date_trunc('month', m.fecha)
                        ORDER BY periodo ASC
                    ''',
                    tuple(params)
                )
                resultados = cursor.fetchall()
                data_result = [{
                    'sensor_id': row[0],
                    'nombre_sensor': row[1],
                    'periodo': row[2].strftime('%Y-%m'),
                    'promedio': round(row[3], 2),
                    'medidas': row[4]
                } for row in resultados]
            elif tipo_reporte == 'semanal':
                cursor.execute(
                    f'''
                        SELECT m.id_sensor, s.nombre_sensor, date_trunc('week', m.fecha) AS periodo,
                               AVG(m.valor_de_la_medida) AS promedio, COUNT(*) AS medidas
                        FROM medidas m
                        JOIN sensores s ON m.id_sensor = s.id
                        WHERE {where_clause}
                        GROUP BY m.id_sensor, s.nombre_sensor, date_trunc('week', m.fecha)
                        ORDER BY periodo ASC
                    ''',
                    tuple(params)
                )
                resultados = cursor.fetchall()
                data_result = [{
                    'sensor_id': row[0],
                    'nombre_sensor': row[1],
                    'periodo': row[2].strftime('%G-W%V'),
                    'promedio': round(row[3], 2),
                    'medidas': row[4]
                } for row in resultados]
            else:
                cursor.execute(
                    f'''
                        SELECT m.id_sensor, s.nombre_sensor, m.fecha, m.valor_de_la_medida
                        FROM medidas m
                        JOIN sensores s ON m.id_sensor = s.id
                        WHERE {where_clause}
                        ORDER BY m.fecha ASC
                    ''',
                    tuple(params)
                )
                resultados = cursor.fetchall()
                data_result = [{
                    'sensor_id': row[0],
                    'nombre_sensor': row[1],
                    'fecha': row[2].strftime('%Y-%m-%d %H:%M:%S'),
                    'valor': row[3]
                } for row in resultados]

        return jsonify({'success': True, 'data': data_result}), 200
    except Exception as exc:
        logger.exception('Error al generar reporte de usuario')
        return jsonify({'success': False, 'message': 'Error al generar el reporte', 'data': []}), 500

if __name__ == "__main__":
    debug_mode = os.environ.get('FLASK_DEBUG', '0') in {'1', 'true', 'True'}
    app.run(debug=debug_mode, host='0.0.0.0', port=port)
