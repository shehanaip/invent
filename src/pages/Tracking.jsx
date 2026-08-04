import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";


export default function Tracking({
  dark,
  setDark,
  logout
}) {


  const [menuOpen,setMenuOpen] = useState(false);

  const [shipments,setShipments] = useState([]);

  const [loading,setLoading] = useState(true);

  const [search,setSearch] = useState("");


  const token = localStorage.getItem("token");




  // ================= FETCH =================


  const fetchShipments = async()=>{


    try{


      const res = await API.get(
        "/shipments",
        {
          headers:{
            Authorization:
            `Bearer ${token}`
          }
        }
      );


      console.log(
        "SHIPMENTS:",
        res.data
      );


      setShipments(
        res.data || []
      );


    }
    catch(err){


      console.log(
        "TRACKING ERROR:",
        err.response?.data ||
        err.message
      );


      setShipments([]);


    }
    finally{


      setLoading(false);


    }


  };





  useEffect(()=>{


    fetchShipments();


  },[]);







  // ================= SEARCH =================


  const filtered =
  shipments.filter((s)=>{


    const text =
    search.toLowerCase();



    return(

      (
        s.productId?.name ||
        ""
      )
      .toLowerCase()
      .includes(text)


      ||

      (
        s.trackingNumber ||
        ""
      )
      .toLowerCase()
      .includes(text)



      ||

      (
        s.location ||
        ""
      )
      .toLowerCase()
      .includes(text)



      ||

      (
        s.status ||
        ""
      )
      .toLowerCase()
      .includes(text)



    );


  });







  // ================= STATUS COLOR =================


  const getStatusColor=(status)=>{


    if(status==="Delivered")
      return "#22c55e";


    if(status==="In Transit")
      return "#f59e0b";


    if(status==="Cancelled")
      return "#ef4444";


    return "#2563eb";


  };








  // ================= ICON =================


  const getStatusIcon=(status)=>{


    switch(status){


      case "Delivered":

        return(
          <i className="fas fa-check-circle"/>
        );



      case "In Transit":

        return(
          <i className="fas fa-truck"/>
        );



      case "Cancelled":

        return(
          <i className="fas fa-times-circle"/>
        );



      default:

        return(
          <i className="fas fa-clock"/>
        );


    }


  };







  // ================= PROGRESS =================


  const getProgress=(status)=>{


    switch(status){


      case "Delivered":
        return 100;


      case "In Transit":
        return 65;


      case "Pending":
        return 25;


      case "Cancelled":
        return 0;


      default:
        return 0;


    }


  };








  // ================= STATS =================


  const total =
  shipments.length;


  const transit =
  shipments.filter(
    s=>s.status==="In Transit"
  ).length;



  const delivered =
  shipments.filter(
    s=>s.status==="Delivered"
  ).length;








  if(loading){


    return(

      <div className="loader-screen">

        <div className="loader-bars">

          <span></span>
          <span></span>
          <span></span>

        </div>


        <h1>
          TRACKING
        </h1>


      </div>

    );


  }








  return(


    <div
      className={
        `app-container ${
          dark ? "dark":"light"
        }`
      }
    >





      <button

        className={
          `hamburger ${
            menuOpen ? "open":""
          }`
        }


        onClick={()=>
          setMenuOpen(!menuOpen)
        }

      >

        <span></span>
        <span></span>
        <span></span>

      </button>






      <Sidebar

        menuOpen={menuOpen}

        dark={dark}

        setDark={setDark}

        logout={logout}

        active="tracking"

      />







      <main className="main-content">






        <div className="topbar">


          <h1>

            <i className="fas fa-map-marker-alt"></i>

            {" "}

            Live Tracking


          </h1>




          <input

            className="search-input"

            placeholder="Search shipment..."

            value={search}

            onChange={(e)=>
              setSearch(
                e.target.value
              )
            }

          />



        </div>









        <div className="stats-grid">


          <div className="stat-card">

            <i className="fas fa-box"></i>

            <h2>
              {total}
            </h2>

            <p>
              Total Shipments
            </p>


          </div>






          <div className="stat-card">

            <i className="fas fa-truck"></i>

            <h2>
              {transit}
            </h2>

            <p>
              In Transit
            </p>


          </div>






          <div className="stat-card">


            <i className="fas fa-check-circle"></i>


            <h2>
              {delivered}
            </h2>


            <p>
              Delivered
            </p>


          </div>



        </div>









        <div className="table-card">


          <h3>

            <i className="fas fa-route"></i>

            {" "}

            Shipment Tracking

          </h3>







          {
          filtered.length===0 ?


          (

            <p>
              No shipments found
            </p>

          )


          :



          filtered.map((s)=>(


            <div

              key={s._id}

              className="tracking-card"

            >







              <div className="tracking-header">



                <h4>

                  <i className="fas fa-barcode"></i>

                  {" "}

                  {
                    s.trackingNumber ||
                    "No Tracking ID"
                  }


                </h4>






                <span

                  style={{

                    color:
                    getStatusColor(
                      s.status
                    ),

                    fontWeight:"700"

                  }}

                >


                  {
                    getStatusIcon(
                      s.status
                    )
                  }


                  {" "}

                  {s.status}


                </span>



              </div>








              <p>

                <i className="fas fa-box"></i>

                {" "}

                <b>
                  Product:
                </b>

                {" "}

                {
                  s.productId?.name ||
                  "Unknown Product"
                }


              </p>







              <p>

                <i className="fas fa-user"></i>

                {" "}

                <b>
                  User:
                </b>

                {" "}

                {
                  s.userId?.name ||
                  s.user?.name ||
                  "Unknown User"
                }


              </p>







              <p>

                <i className="fas fa-location-dot"></i>

                {" "}

                {
                  s.location ||
                  "No Location"
                }


              </p>








              <div
                className="progress-container"
              >


                <div

                  className="progress-bar"

                  style={{

                    width:
                    `${getProgress(
                      s.status
                    )}%`,


                    background:
                    getStatusColor(
                      s.status
                    )

                  }}

                ></div>



              </div>








              <div
                className="tracking-steps"
              >

                <span>
                  Ordered
                </span>


                <span>
                  Packed
                </span>


                <span>
                  Transit
                </span>


                <span>
                  Delivered
                </span>


              </div>







              <small>

                Progress:

                {" "}

                {
                  getProgress(
                    s.status
                  )
                }%

              </small>







            </div>


          ))

          }




        </div>





      </main>




    </div>


  );


}