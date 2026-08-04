import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import API from "../api";

export default function Tracking({ dark, setDark, logout }) {

  const [menuOpen, setMenuOpen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");


  // ================= FETCH SHIPMENTS =================

  const fetchShipments = async () => {

    try {

      const res = await API.get("/shipments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      setShipments(res.data || []);


    } catch (err) {

      console.log(
        "TRACKING ERROR:",
        err.response?.data || err.message
      );

      setShipments([]);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchShipments();

  }, []);




  // ================= SEARCH =================

  const filtered = shipments.filter((s) => {

    const text = search.toLowerCase();


    return (

      (s.productId?.name || "")
        .toLowerCase()
        .includes(text)

      ||

      (s.trackingNumber || "")
        .toLowerCase()
        .includes(text)

      ||

      (s.location || "")
        .toLowerCase()
        .includes(text)

      ||

      (s.status || "")
        .toLowerCase()
        .includes(text)

    );

  });





  // ================= STATUS COLOR =================

  const getStatusColor = (status) => {

    switch(status) {

      case "Delivered":
        return "#22c55e";

      case "In Transit":
        return "#2563eb";

      case "Cancelled":
        return "#ef4444";

      case "Pending":
        return "#f59e0b";

      default:
        return "#999";

    }

  };





  // ================= STATUS ICON =================

  const getStatusIcon = (status) => {

    switch(status) {

      case "Delivered":

        return (
          <i className="fas fa-check-circle"></i>
        );


      case "In Transit":

        return (
          <i className="fas fa-truck"></i>
        );


      case "Cancelled":

        return (
          <i className="fas fa-times-circle"></i>
        );


      default:

        return (
          <i className="fas fa-clock"></i>
        );

    }

  };





  // ================= PROGRESS =================

  const getProgress = (status) => {

    switch(status) {

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

  const total = shipments.length;

  const inTransit =
    shipments.filter(
      s => s.status === "In Transit"
    ).length;


  const delivered =
    shipments.filter(
      s => s.status === "Delivered"
    ).length;





  // ================= LOADING =================

  if (loading) {

    return (

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





  return (

    <div
      className={`app-container ${
        dark ? "dark" : "light"
      }`}
    >



      {/* HAMBURGER */}

      <button
        className={`hamburger ${
          menuOpen ? "open" : ""
        }`}
        onClick={() =>
          setMenuOpen(!menuOpen)
        }
      >

        <span></span>
        <span></span>
        <span></span>

      </button>





      {/* SIDEBAR */}

      <Sidebar

        menuOpen={menuOpen}

        dark={dark}

        setDark={setDark}

        logout={logout}

        active="tracking"

      />






      <main className="main-content">



        {/* TOPBAR */}

        <div className="topbar">


          <h1>

            <i className="fas fa-map-marker-alt"></i>

            {" "}

            Live Tracking

          </h1>



          <input

            className="search-input"

            placeholder="Search product or tracking..."

            value={search}

            onChange={(e)=>
              setSearch(e.target.value)
            }

          />


        </div>






        {/* STATS */}

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
              {inTransit}
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






        {/* TRACKING LIST */}

        <div className="table-card">


          <h3>

            <i className="fas fa-route"></i>

            {" "}

            Shipment Tracking

          </h3>





          {
            filtered.length === 0 ?


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
                      s._id
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

                  {
                    s.productId?.name ||
                    "Unknown Product"
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






                {/* PROGRESS BAR */}

                <div className="progress-container">


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






                <div className="tracking-steps">

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