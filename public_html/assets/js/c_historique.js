(function ($) {
    const site_url = $('#url_js').val(); // Adresse du site
    const base_url = $('#url2_js').val(); // Adresse du site sans index
    const valVibrationsMax = 6; // Hauteur du graphique

    var arrayChart = []; // Array contenant les graphiques crées 
    var arrayConfig = []; // Array contenant les config pour les graphiques   
    var seuil = []; // Array contenant les seuils récupérés 
    var moteurs; // Resultat de la requete ajax sur les moteurs
    var nbrCapteurs; // Nombre de capteurs pour la machine
    var idGraph // Id du graphique a mettre a hour

    var numMachine = parseInt(window.location.pathname.split("/").pop()); // Extraire le numero de la machine depui l'url
    // Code html pour creer un graphique. 
    var code_html1 = "<div class='col-lg-8'> \n\
    <div class='au-card recent-report'> \n\
    <div class='au-card-inner'> \n\
    <h3 class='title-2'>";

    var code_html2 = "</h3> \n\
    <div class='recent-report__chart'> \n\
    <canvas id='graphCapteur";

    var code_html3 = "'></canvas> \n\
    </div> \n\
    </div> \n\
    <input type='date' id='choixDate";

    var code_html4 = "'> \n\
    </div>\n\
    </div>";

    //Heure pour le label
    var date = new Date();
    var dataHeures = [];

    // Couleurs utilisées dans les grapgiques
    const ln_blue = 'rgba(80, 140, 200, 1)';
    const ln_vert = 'rgba(140, 210, 65, 1)';
    const ln_jaune = 'rgba(220, 220, 60, 1)';
    const ln_orange = 'rgba(255, 160 55, 1)';
    const ln_rouge = 'rgba(250, 66, 81, 1)';
    const bg_vert = 'rgba(140, 210, 65, 0.82)';
    const bg_jaune = 'rgba(220, 220, 60, 0.82)';
    const bg_orange = 'rgba(255, 160, 55, 0.82)';
    const bg_rouge = 'rgba(250, 66, 81, 0.82)';
    const transparent = 'transparent';
    // --------------------------------------------
    // --------  DEBUT programme principal  -------
    // --------------------------------------------
    getMoteur();
    // --------------------------------------------
    // --------   FIN programme principal  --------
    // --------------------------------------------



    // ------ Recuperer les infos sur les moteurs ------
    function getMoteur() {
        url = site_url + '/REST/moteur/' + numMachine;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (result) {
                moteurs = result;
                getCapteurs();
            }
        });
    }
    // -------------------------------------------



    // ------ Recuperer les capteurs ------
    function getCapteurs() {

        url = site_url + "/REST/capteur/" + numMachine;

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (result) {
                if (result.length > 0) {

                    initTime();
                    nbrCapteurs = result.length;

                    for (i = 0; i < nbrCapteurs; i++) {
                        // Creation du graphique
                        $("#divGraph").append(code_html1 + moteurs[i]['fonction'] + code_html2 + i + code_html3 + i + code_html4);
                        var ctx = document.getElementById("graphCapteur" + [i]);

                        if (ctx) {
                            ctx.height = 230;
                            arrayChart.push(new Chart(ctx, getNewConfig()));
                        }
                    }

                    getValSeuil();

                } else {
                    // Afficher un message si il n'y a aucun capteur
                    $("#divGraph").append('<figure> \n\
                        <img src="' + base_url + '/assets/images/icon/supersad.png" class="img-fluid mx-auto d-block"> \n\
                        <figcaption> <br> Il n\'y a aucun capteur pour cette machine. </figcaption> \n\
                        </figure> ');
                    $("#divGraph").css("margin-top", "5%");
                }

            }
        });
    }
    // -------------------------------------------



    // ------ Recuperer les valeurs du seuil ------
    function getValSeuil() {

        url = site_url + '/REST/norme/1';

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (result) {
                for (i = 0; i < result.length; i++) {
                    seuil[i] = result[i]['seuil'];
                }

                // Afficher les seuils sur tous les graphique
                for (i = 0; i < arrayConfig.length; i++) // Pour tous les graph
                {
                    for (j = 0; j < arrayConfig[i].data.labels.length; j++) // Pour tout les labels
                    {
                        // Ajouter la valeurs du seuil
                        arrayConfig[i].data.datasets[1].data.push(seuil[0]);
                        arrayConfig[i].data.datasets[2].data.push(seuil[1]);
                        arrayConfig[i].data.datasets[3].data.push(seuil[2]);
                        arrayConfig[i].data.datasets[4].data.push(seuil[3]);
                    }
                }
                initCalendrier();
            }
        });
    }
    // --------------------------------------------



    // ------ Initialiser l'input date------
    function initCalendrier() {
        // Initialiser le calendrier
        for (i = 0; i < nbrCapteurs; i++) {
            document.getElementById("choixDate" + i).value = date.toISOString().slice(0, 10);
            idGraph = i;
            $("#choixDate" + i).on('change', updateData);
        }

        getData();
    }
    // ------ Recuperer les valeurs des vibrations------



    // ------ MAJ des donnes quand changement de date ------
    function updateData() {

        clearGraph();

        dates_url = document.getElementById("choixDate0").value.split("-");
        url = site_url + '/REST/vibration/' + idGraph + "/" + dates_url[0] + dates_url[1] + dates_url[2];

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (result) {
                if (result.length) {
                    var indexChart = 0; // Index du graphique dans l'array
                    var idMoteurMin = parseInt(result[0]['idMoteur']); // Id du moteur min recupéré

                    // Ajouter les données
                    for (i = 0; i < result.length; i++) // Pour tous les resultats
                    {
                        if (idMoteurMin === parseInt(result[i]['idMoteur'])) {
                            // Valeurs reçues
                            arrayConfig[indexChart].data.datasets[0].data.push(result[i]['valeur']);
                        } else {
                            indexChart = indexChart + 1;
                            do {
                                idMoteurMin = idMoteurMin + 1;
                            } while (idMoteurMin < result[i]['idMoteur']);
                        }
                    }

                    // Mettre a jour les grpahiques 
                    for (i = 0; i < arrayChart.length; i++) {
                        arrayChart[i].update(); // Mise a jour de donnéess
                    }
                }
            }
        });
    }
    // --------------------------------------------------




    // ------ Recuperer les valeurs des vibrations------
    function getData() {

        dates_url = document.getElementById("choixDate0").value.split("-");
        url = site_url + '/REST/vibration/' + numMachine + "/" + dates_url[0] + dates_url[1] + dates_url[2];

        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            success: function (result) {

                if (result.length > 1) {

                    console.log("resultat");
                    var indexChart = 0; // Index du graphique dans l'array
                    var idMoteurMin = parseInt(result[0]['idMoteur']); // Id du moteur min recupéré

                    // Ajouter les données
                    for (i = 0; i < result.length; i++) // Pour tous les resultats
                    {
                        if (idMoteurMin === parseInt(result[i]['idMoteur'])) {
                            // Valeurs reçues
                            arrayConfig[indexChart].data.datasets[0].data.push(result[i]['valeur']);
                        } else {
                            indexChart = indexChart + 1;
                            do {
                                idMoteurMin = idMoteurMin + 1;
                            } while (idMoteurMin < result[i]['idMoteur']);
                        }
                    }

                } else {
                    console.log("noresult");
                }

                // Mettre a jour les grpahiques 
                for (i = 0; i < arrayChart.length; i++) {
                    arrayChart[i].update(); // Mise a jour de donnéess
                }

            }
        });

    }
    // ----------------------------------------------



    // ---------------- Vider le graph ----------------
    function clearGraph() {

        tailleArray = arrayChart[idGraph - 1].data.datasets[0].data.length;

        for (i = 0; i < tailleArray; i++) {
            arrayChart[idGraph - 1].data.datasets[0].data.shift();
        }

        arrayChart[idGraph - 1].update();
    }
    // ------------------------------------------------



    // ------ Ajouter les labels ------
    function initTime() {

        for (j = 0; j < 24; j++)
        {

            dataHeures.push(("0" + j).slice(-2) + 'h');

            // 60 minutes
            for (i = 0; i < 59; i++) {
                dataHeures.push('');
            }
        }
    }
    // --------------------------------




    // ------ Creer une config pour chaque graph ------
    function getNewConfig() {

        // --- Début fichier config du graphiqe  ---
        config = {
            type: 'line',
            data: {
                labels: dataHeures,
                datasets: [{
                        label: 'Valeur des vibrations',
                        backgroundColor: transparent,
                        borderColor: ln_blue,
                        pointHoverBackgroundColor: '#fff',
                        borderWidth: 0,
                        data: [],
                        pointBackgroundColor: ln_blue
                    },
                    {
                        label: 'Seuil A',
                        backgroundColor: bg_vert,
                        borderColor: ln_vert,
                        pointHoverBackgroundColor: transparent,
                        borderWidth: 0,
                        pointRadius: 0,
                        data: [],
                        pointBackgroundColor: transparent,
                        fill: '+1'
                    },
                    {
                        label: 'Seuil B',
                        backgroundColor: bg_jaune,
                        borderColor: ln_jaune,
                        pointHoverBackgroundColor: transparent,
                        borderWidth: 0,
                        pointRadius: 0,
                        data: [],
                        pointBackgroundColor: transparent,
                        fill: '+1'
                    },
                    {
                        label: 'Seuil C',
                        backgroundColor: bg_orange,
                        borderColor: ln_orange,
                        pointHoverBackgroundColor: transparent,
                        borderWidth: 0,
                        pointRadius: 0,
                        data: [],
                        pointBackgroundColor: transparent,
                        fill: '+1'
                    },
                    {
                        label: 'Seuil D',
                        backgroundColor: bg_rouge,
                        borderColor: transparent,
                        pointHoverBackgroundColor: transparent,
                        borderWidth: 0,
                        pointRadius: 0,
                        data: [],
                        pointBackgroundColor: transparent,
                        fill: 'end'
                    }
                ]

            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: true
                },
                responsive: true,
                scales: {
                    xAxes: [{
                            gridLines: {
                                display: false,
                                drawOnChartArea: true,
                                color: '#f2f2f2'
                            },
                            ticks: {
                                fontFamily: "Poppins",
                                fontSize: 11,
                                autoSkip: false,
                                beginAtZero: true
                            }
                        }],
                    yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                maxTicksLimit: 5,
                                stepSize: 1,
                                autoSkip: false,
                                max: valVibrationsMax,
                                fontFamily: "Poppins",
                                fontSize: 11
                            },
                            gridLines: {
                                display: false,
                                color: '#f2f2f2'
                            }
                        }]
                },
                elements: {
                    point: {
                        radius: 3,
                        hoverRadius: 4,
                        hoverBorderWidth: 3,
                        backgroundColor: '#333'
                    }
                },
                tooltips: {
                    mode: 'y'
                }
            }
        };
        // --- Fin fichier config du graphiqe  ---

        arrayConfig.push(config);
        return arrayConfig[arrayConfig.length - 1]; // Derniere valeur
    }
    // ------------------------------------------------ 



})(jQuery);