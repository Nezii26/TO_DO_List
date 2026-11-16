
function addTask() {
    
    
    

}


function addItem() {

    let itemCode = document.getElementById("txtcode").value;
    let itemName = document.getElementById("txtiName").value;
    let itemPrice = document.getElementById("txtprice").value;
    let itemdate = document.getElementById("txtdate").value;
    let itemContact = document.getElementById("txtContact").value;


    let item = {
        code:itemCode,
        name: itemName,
        price:itemPrice,
        expdate:itemdate,
        contact:itemContact
    }

    itemList.push(item);

    loaditemTable();

    console.log(itemList);

}


function loaditemTable(){

    let itembody =`
            <tr>
                <th>Item code</th>
                <th>Name</th>
                <th>Price</th>
                <th>Exp.Date</th>
                <th>Contact</th>
            </tr>
 `;

    for(let item of itemList){
        itembody+=`
        <tr>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.price}</td>
            <td>${item.expdate}</td>
            <td>${item.contact}</td>
        </tr> 
        `

    }
    document.getElementById("tblItem").innerHTML = itembody;

}

