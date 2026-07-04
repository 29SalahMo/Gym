<?php
$dbServername = "localhost";
$dbUsername = "root"; 
$dbPassword = "";
$dbName = "gym data";

// Create connection
$conn = new mysqli($dbServername, $dbUsername, $dbPassword, $dbName);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Insert logic using prepared statements
if (isset($_POST['id']) && isset($_POST['firstname']) && isset($_POST['lastname']) && isset($_POST['gender'])) {
    $id = intval($_POST['id']);
    $firstname = $_POST['firstname'];
    $lastname = $_POST['lastname'];
    $gender = $_POST['gender'];

    // Insert user info securely using parameterized query
    $stmt = $conn->prepare("INSERT INTO myinfo (id, firstname, lastname, gender) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $id, $firstname, $lastname, $gender);
    
    if ($stmt->execute()) {
        echo "New record created successfully<br><br>";
    } else {
        echo "Error: " . htmlspecialchars($stmt->error) . "<br><br>";
    }
    $stmt->close();
}

$sql = "SELECT id, firstname, lastname, gender FROM myinfo";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
  echo "<h3>Registered Gym Members:</h3>";
  // output data of each row
  while($row = $result->fetch_assoc()) {
    echo "ID: " . htmlspecialchars($row["id"]). " - Name: " . htmlspecialchars($row["firstname"]). " " . htmlspecialchars($row["lastname"]). " - Gender: " . htmlspecialchars($row["gender"]). "<br>";
  }
} else {
  echo "0 results";
}

$conn->close();
?>