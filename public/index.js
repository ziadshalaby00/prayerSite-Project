
let surah = document.getElementById("surah");
let info = document.getElementById("info");

let randomAyah = Math.floor(Math.random() * 6236);

async function randomAayah() {
    let response = await axios.get(`https://api.alquran.cloud/v1/ayah/${randomAyah}`)
    surah.innerHTML = `{${response.data.data.text}}<span id="info">
                                ${response.data.data.surah.name}, آية: ${response.data.data.numberInSurah}
                            </span>`;
}
randomAayah();
////////////////////////////////////////////////////////////////////////////////////////////////////////

const prayerTimes = ['الفجر', 'شروق الشمس', 'الظهر', 'العصر', 'الغروب', 'المغرب', 'العشاء', 'الإمساك', 'منتصف الليل', 'ثلث الليل الأول', 'ثلث الليل الأخير'];

function getLocation() {
    document.getElementById("loding").innerHTML = "Loading...";
    // التحقق مما إذا كانت خدمة الموقع مدعومة في المتصفح
    if (navigator.geolocation) {
        // الحصول على الموقع
        navigator.geolocation.getCurrentPosition(showPosition, handleError);
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    showPrayTimer(latitude, longitude);
}

function handleError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("loding").innerHTML = ".يرجى تفعيل الموقع الجغرافي لكي نتمكن من عرض الوقت الصحيح للصلاة"
            document.getElementById("loding").innerHTML += `<br>يمكنك تفعيله بالذهاب ال 
                                                            <span class="material-symbols-outlined">
                                                                location_on
                                                            </span>
                                                            وعمل سماح`
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("loding").innerHTML = "الموقع الجغرافي غير متاح.";
            break;
        case error.TIMEOUT:
            document.getElementById("loding").innerHTML = ".انتهت المهلة للحصول على الموقع الجغرافي";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("loding").innerHTML = "حدث خطأ غير معروف.";
            break;
    }
}

async function setCard(response) {
    document.getElementById("loding").innerHTML = "";
    let date = response.data.data.date.hijri.weekday.ar + " " + response.data.data.date.readable;
    document.getElementById("dateH6").innerHTML = date

    timings = response.data.data.timings;
    let i=0;
    for(let time in timings)
    {
        let toSmall;
        toSmall = prayerTimes[i].length > 7 ? "font-size: 20px" : "";

        let structure = `
                    <div class="card">
                        <div class="headerCard">
                            <h3 style="margin: 0; ${toSmall}">${prayerTimes[i]}</h3>
                        </div>
                        <div class="bodyCard">
                            <h2>${timings[time]}</h2>
                        </div>
                    </div>`
        document.getElementById("cards").innerHTML += structure
        i++;
    }
    return timings;
}

async function showPrayTimer(latitude, longitude)
{
    let dateNow = new Date();

    const day = dateNow.getDate();
    const month = dateNow.getMonth() + 1; 
    const year = dateNow.getFullYear();

    let date = day + '-' + month + '-' + year;

    let params = {
        latitude: latitude,
        longitude: longitude,
        method: 5,
        shafaq: "general"
    }

    let response = await axios.get(`https://api.aladhan.com/v1/timings/${date}`, {
        params: params
    })

    let timings = await setCard(response)
    calcTime(timings)
}

function calcTime(timings) {
    let arr = []
    let dateNow = new Date();
    let i=0;

    for(let time in timings)
    {
        let hoursPray = Number(timings[time][0])*10 + Number(timings[time][1]);
        if(hoursPray === 0)
        {
            hoursPray = 24;
        }
        let minutesPray = Number(timings[time][3])*10 + Number(timings[time][4]);
        
        let hours = dateNow.getHours();
        if(hours === 0)
        {
            hours = 24;
        }
        arr[i] = (hoursPray*60 + minutesPray) - (hours*60 + dateNow.getMinutes() + dateNow.getSeconds()/60);
        i++;
    }

    const positiveArray = arr.map((num) => {
        return num < 0 ? 1500 : num
    });

    const { minValue, index } = positiveArray.reduce((acc, current, ind) => {
        if (current < acc.minValue) {
            acc.minValue = current; // تحديث القيمة الأقل
            acc.index = ind; // تحديث المؤشر
        }
        return acc; // إرجاع المجمع
    }, { minValue: positiveArray[0], index: 0 });

    showInDiv(minValue, index, timings);
}


function showInDiv(minValue, index, timings) {
    document.getElementById("NextPray").innerHTML = `متبقى على ${prayerTimes[index]}`

    let seconds = minValue - Math.floor(minValue);
    seconds *= 60;
    seconds = Math.floor(seconds);

    let hours = Math.floor(minValue/60);
    let minutes = Math.floor(minValue%60);

    let intervalId = setInterval(() => {
        if(seconds < 0)
        {
            seconds = 59;
            minutes--;
        }
        if(minutes < 0)
        {
            minutes = 59
            hours--;
        }
        if(hours < 0)
        {
            calcTime(timings);
            clearInterval(intervalId);
        }
        document.getElementById("timeNextPray").innerHTML = `${hours}:${minutes}:${seconds}`;
        seconds--;
    }, 1000)
}
getLocation();