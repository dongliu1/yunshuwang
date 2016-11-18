<?php
/**
 * Created by PhpStorm.
 * User: liudong
 * Date: 2016/11/18
 * Time: 13:58
 */
if(!empty($_POST)) {
    $account = $_POST["account"];
    $link=new mysqli("localhost","root","dqTKqNta2dJTF7EU","db_ysw");
    if ($link->connect_error) {
        die("连接失败: " . $link->connect_error);
    }

    $sql = "SELECT usertype FROM ysw_account where account='".$account."'";
    $result = $link->query($sql);
    if ($result->num_rows > 0) {
        // 输出每行数据
        while($row = $result->fetch_assoc()) {
            if($row["usertype"]==1){
                echo false;
            }else{
                echo true;
            }
        }
    }
    $link->close();
}
?>