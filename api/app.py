from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import uuid
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve environment variables
db_host = os.getenv('DB_HOST')
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_database = os.getenv('DB_DATABASE')

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}},
     methods=["GET", "POST", "PUT", "DELETE"])

# Database connection configuration
db_config = {
    'host': db_host,
    'user': db_user,
    'password': db_password,
    'database': db_database,
}

# Connect to PostgreSQL database
conn = psycopg2.connect(**db_config)


@app.route('/tasks', methods=['GET'])
def get_tasks():
    show_completed = request.args.get('show_completed', default='false')

    # Open a cursor to perform database operations
    with conn.cursor() as cursor:
        if show_completed == 'true':
            cursor.execute('SELECT * FROM tasks WHERE completed = true')
        else:
            cursor.execute('SELECT * FROM tasks WHERE completed = false')

        tasks = cursor.fetchall()

    # Convert the completed field to boolean
    tasks_with_bool = []
    for task in tasks:
        task_with_bool = {
            'id': str(task[0]),
            'title': task[1],
            'description': task[2],
            'completed': bool(task[3])
        }
        tasks_with_bool.append(task_with_bool)

    return jsonify(tasks_with_bool)


@app.route('/tasks', methods=['POST'])
def create_task():
    try:
        data = request.json
        title = data['title']
        description = data['description']
        task_id = str(uuid.uuid4())  # Generate UUID

        with conn.cursor() as cursor:
            cursor.execute(
                'INSERT INTO tasks (id, title, description) VALUES (%s, %s, %s)', (task_id, title, description))
            conn.commit()

        return jsonify({'message': 'Task created successfully'})
    except Exception as e:
        return jsonify({'error': 'Failed to create task', 'details': str(e)}), 500


@app.route('/tasks/<string:task_id>', methods=['PUT'])
def update_task(task_id):
    try:
        data = request.json
        title = data['title']
        description = data['description']
        completed = data['completed']

        with conn.cursor() as cursor:
            cursor.execute('UPDATE tasks SET title = %s, description = %s, completed = %s WHERE id = %s',
                           (title, description, completed, task_id))
            conn.commit()

        return jsonify({'message': 'Task updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/tasks/<string:task_id>', methods=['DELETE'])
def delete_task(task_id):
    try:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
            conn.commit()

        return jsonify({'message': 'Task deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
