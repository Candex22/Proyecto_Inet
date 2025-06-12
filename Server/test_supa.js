// test_supabase.js
const dotenv = require('dotenv');

// Antes: import { createClient } from '@supabase/supabase-js';
const { createClient } = require('@supabase/supabase-js');

dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('ERROR: Las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testInsert() {
    console.log('Iniciando prueba de inserción...');
    try {
        const { data, error } = await supabase
            .from('Usuarios') // Asegúrate de que este sea el nombre correcto de la tabla, Ej: 'Usuario' o 'usuarios'
            .insert([
                {
                    nombre: 'Test',
                    apellido: 'User',
                    nombre_usuario: 'testuser123',
                    email: `test${Date.now()}@example.com`, // Email único para evitar duplicados
                    contraseña: 'password_hasheada_ficticia',
                    rol: 'usuario'
                }
            ])
            .select();

        if (error) {
            console.error('❌ Error de Supabase en script de prueba:', error);
            if (Object.keys(error).length === 0) {
                console.error('El objeto de error de Supabase está vacío en la prueba. Esto es muy inusual si la Service Role Key está bien.');
            }
        } else {
            console.log('✅ Inserción exitosa en Supabase desde script de prueba:', data);
        }
    } catch (e) {
        console.error('❌ Error general en script de prueba:', e);
    }
}

testInsert();