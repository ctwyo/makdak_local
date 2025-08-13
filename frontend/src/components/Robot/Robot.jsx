import "./robot.css";
const Robot = () => {
  return (
    <div className="scene">
      <div className="man">
        <div className="head"></div>
        <div className="body">
          <div className="left-hand"></div>
          <div className="right-hand"></div>
        </div>
        {/* <div className="legs">
          <div className="left-leg"></div>
          <div className="right-leg"></div>
        </div> */}
      </div>
    </div>
  );
};

export default Robot;
