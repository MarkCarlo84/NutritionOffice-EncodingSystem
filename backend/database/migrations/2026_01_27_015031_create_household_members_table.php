<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * BNS Form No. 1A - Name of Father (Fa), Mother (Mo), Caregiver (Ca) | Occupation | Educational Attainment | Practicing Family Planning
     */
    public function up(): void
    {
        Schema::create('household_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('household_id')->constrained()->onDelete('cascade');

            // C26/C27/C28: Name of Father (Fa), Mother (Mo), Caregiver (Ca)
            $table->string('name')->nullable();
            $table->enum('role', ['father', 'mother', 'caregiver']);

            // C29/C30/C31: Occupation (1-Manager, 2-Professional, …, 11-None)
            $table->string('occupation', 20)->nullable();

            // C32/C33/C34: Educational Attainment (N, EU, EG, HU, HG, CU, CG, V, PG)
            $table->string('educational_attainment', 10)->nullable();

            // Practicing Family Planning (Yes/No) per member
            $table->boolean('practicing_family_planning')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('household_members');
    }
};
